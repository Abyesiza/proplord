-- Rent tracker for admins, landlords and caretakers. Replaces the charge-based admin tracker.
-- Each active tenant owes their monthly rent. A month counts as paid when period-covered payments
-- reach it, so someone who prepaid many months shows as paid in every one of them. The pay day is the
-- day of the month they first paid on (or joined on, before any payment).

drop function if exists public.admin_month_tracker(date, uuid);

create or replace function public.rent_tracker(p_month date, p_scope uuid[] default null, p_property uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with bounds as (
    select date_trunc('month', p_month)::date as start_day,
           (date_trunc('month', p_month) + interval '1 month')::date as end_day
  ),
  cur as (
    select coalesce(
      (select pr.currency::text from public.properties pr
        where p_scope is null or pr.id = any(p_scope)
        group by pr.currency order by count(*) desc, pr.currency limit 1),
      'UGX') as code
  ),
  tenants as (
    select
      m.id as member_id, m.property_id, m.created_at as joined_at,
      m.payment_frequency::text as frequency,
      coalesce(
        m.agreed_amount / case m.payment_frequency
          when 'biweekly' then 0.5 when 'monthly' then 1 when 'quarterly' then 3
          when 'semiannual' then 6 else 12 end,
        un.rent_amount, 0) as monthly,
      un.name as unit_name,
      coalesce(t.full_name, t.username) as tenant_name,
      pr.name as property_name, pr.city, o.full_name as landlord_name
    from bounds b
    cross join cur
    join public.properties pr
      on pr.currency = cur.code
     and (p_scope is null or pr.id = any(p_scope))
     and (p_property is null or pr.id = p_property)
    join public.profiles o on o.id = pr.owner_id
    join public.property_members m
      on m.property_id = pr.id and m.role = 'tenant' and m.status = 'active'
     and m.created_at < b.end_day
    left join public.units un on un.id = m.unit_id
    left join public.profiles t on t.id = m.user_id
  ),
  pay as (
    select p.member_id, p.amount, p.paid_at, p.period_start, p.period_end
    from public.payments p
    where p.status = 'completed' and p.member_id in (select member_id from tenants)
  ),
  anchor as (
    select member_id,
           coalesce(min(paid_at) filter (where period_start is not null), min(paid_at)) as first_paid
    from pay group by member_id
  ),
  lines as (
    select
      t.*, b.start_day, (b.end_day - b.start_day) as dim,
      b.start_day + (least(
        extract(day from coalesce(a.first_paid, t.joined_at))::int, b.end_day - b.start_day) - 1) as due_date,
      coalesce((select sum(greatest(0, least(p.period_end, b.end_day) - greatest(p.period_start, b.start_day)))
                from pay p where p.member_id = t.member_id and p.period_start is not null), 0) as covered_days,
      exists (select 1 from pay p
              where p.member_id = t.member_id and p.period_start is not null
                and p.period_start < b.end_day and p.period_end > b.start_day
                and p.paid_at::date < b.start_day) as prepaid,
      (select max(p.period_end) - 1 from pay p
        where p.member_id = t.member_id and p.period_start is not null) as paid_through,
      coalesce((select sum(p.amount) from pay p
                where p.member_id = t.member_id and p.period_start is null
                  and p.paid_at >= b.start_day and p.paid_at < b.end_day), 0) as other_paid
    from tenants t
    cross join bounds b
    left join anchor a on a.member_id = t.member_id
    where t.monthly > 0
  ),
  rated as (
    select lines.*,
      least(monthly, round(monthly * least(covered_days, dim) / dim, 2) + other_paid) as paid
    from lines
  ),
  rows_ as (
    select rated.*,
      case
        when paid >= monthly and prepaid and covered_days >= dim then 'prepaid'
        when paid >= monthly then 'paid'
        when paid > 0 then 'partial'
        when due_date < current_date then 'overdue'
        else 'pending'
      end as state
    from rated
  ),
  days as (
    select generate_series(b.start_day::timestamp, (b.end_day - 1)::timestamp, interval '1 day')::date as d
    from bounds b
  )
  select jsonb_build_object(
    'month', (select to_char(start_day, 'YYYY-MM') from bounds),
    'currency', (select code from cur),
    'summary', jsonb_build_object(
      'tenants', (select count(*) from rows_),
      'expected', (select coalesce(sum(monthly), 0) from rows_),
      'paid', (select coalesce(sum(paid), 0) from rows_),
      'outstanding', (select coalesce(sum(monthly - paid), 0) from rows_),
      'paidCount', (select count(*) from rows_ where state in ('paid', 'prepaid')),
      'prepaidCount', (select count(*) from rows_ where state = 'prepaid'),
      'partialCount', (select count(*) from rows_ where state = 'partial'),
      'overdueCount', (select count(*) from rows_ where state = 'overdue'),
      'pendingCount', (select count(*) from rows_ where state = 'pending')
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', extract(day from days.d)::int,
        'expected', coalesce((select sum(r.monthly) from rows_ r where r.due_date = days.d), 0),
        'paid', coalesce((select sum(r.paid) from rows_ r where r.due_date = days.d), 0)
      ) order by days.d)
      from days
    ),
    'rows', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      from (
        select member_id, tenant_name, unit_name, property_id, property_name, city, landlord_name,
               due_date, monthly as expected, paid, state, paid_through, frequency
        from rows_
        order by case state when 'overdue' then 0 when 'partial' then 1 when 'pending' then 2
                            when 'paid' then 3 else 4 end,
                 due_date, property_name, unit_name
        limit 300
      ) x
    ),
    'truncated', (select count(*) > 300 from rows_)
  );
$$;

revoke execute on function public.rent_tracker(date, uuid[], uuid) from public, anon, authenticated;
grant execute on function public.rent_tracker(date, uuid[], uuid) to service_role;

notify pgrst, 'reload schema';
