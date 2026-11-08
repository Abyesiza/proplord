-- Admin payment tracker: what is due in a month, who has paid, and when money came in.

create or replace function public.admin_month_tracker(p_month date, p_property uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with bounds as (
    select date_trunc('month', p_month)::date as start_day,
           (date_trunc('month', p_month) + interval '1 month')::date as end_day
  ),
  base as (
    select
      c.id, c.due_date, c.amount, c.description,
      coalesce((select sum(p.amount) from public.payments p
                where p.charge_id = c.id and p.status = 'completed'), 0) as paid,
      pr.id as property_id, pr.name as property_name, pr.city,
      un.name as unit_name,
      coalesce(t.full_name, t.username) as tenant_name,
      o.full_name as landlord_name
    from bounds b
    join public.charges c on c.due_date >= b.start_day and c.due_date < b.end_day
    join public.properties pr on pr.id = c.property_id
    join public.profiles o on o.id = pr.owner_id
    join public.property_members m on m.id = c.member_id
    left join public.units un on un.id = m.unit_id
    left join public.profiles t on t.id = m.user_id
    where c.status <> 'cancelled'
      and pr.currency = public.platform_currency()
      and (p_property is null or pr.id = p_property)
  ),
  lines as (
    select base.*,
      case
        when paid >= amount then 'paid'
        when paid > 0 then 'partial'
        when due_date < current_date then 'overdue'
        else 'pending'
      end as state
    from base
  ),
  days as (
    select generate_series(b.start_day::timestamp, (b.end_day - 1)::timestamp, interval '1 day')::date as d
    from bounds b
  ),
  received as (
    select least(greatest(p.paid_at::date, b.start_day), b.end_day - 1) as d, p.amount
    from bounds b
    cross join base
    join public.payments p on p.charge_id = base.id and p.status = 'completed'
  )
  select jsonb_build_object(
    'month', (select to_char(start_day, 'YYYY-MM') from bounds),
    'currency', public.platform_currency(),
    'summary', jsonb_build_object(
      'charges', (select count(*) from lines),
      'expected', (select coalesce(sum(amount), 0) from lines),
      'collected', (select coalesce(sum(paid), 0) from lines),
      'outstanding', (select coalesce(sum(greatest(amount - paid, 0)), 0) from lines),
      'paid', (select count(*) from lines where state = 'paid'),
      'partial', (select count(*) from lines where state = 'partial'),
      'overdue', (select count(*) from lines where state = 'overdue'),
      'pending', (select count(*) from lines where state = 'pending')
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', extract(day from days.d)::int,
        'expected', coalesce((select sum(l.amount) from lines l where l.due_date = days.d), 0),
        'collected', coalesce((select sum(r.amount) from received r where r.d = days.d), 0)
      ) order by days.d)
      from days
    ),
    'rows', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      from (
        select id, due_date, amount, paid, state, description, property_id, property_name,
               city, unit_name, tenant_name, landlord_name
        from lines
        order by case state when 'overdue' then 0 when 'partial' then 1 when 'pending' then 2 else 3 end,
                 due_date, property_name, unit_name
        limit 300
      ) x
    ),
    'truncated', (select count(*) > 300 from lines)
  );
$$;

revoke execute on function public.admin_month_tracker(date, uuid) from public, anon, authenticated;
grant execute on function public.admin_month_tracker(date, uuid) to service_role;

notify pgrst, 'reload schema';
