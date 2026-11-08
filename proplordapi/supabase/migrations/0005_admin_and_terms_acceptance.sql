-- Platform admin role, tenant acceptance of terms, and aggregate reporting for the admin dashboard.

alter type public.user_role add value if not exists 'admin';

-- A tenant accepts one version of a property's terms; editing the terms changes the hash.
create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  member_id uuid not null references public.property_members (id) on delete cascade,
  terms_hash text not null,
  accepted_at timestamptz not null default now(),
  unique (member_id, terms_hash)
);
create index terms_acceptances_property_idx on public.terms_acceptances (property_id);
alter table public.terms_acceptances enable row level security;

create policy terms_acceptances_select on public.terms_acceptances for select to authenticated using (
  public.is_property_staff(property_id)
  or exists (select 1 from public.property_members m
             where m.id = terms_acceptances.member_id and m.user_id = auth.uid())
);
create policy terms_acceptances_insert on public.terms_acceptances for insert to authenticated with check (
  exists (select 1 from public.property_members m
          where m.id = terms_acceptances.member_id
            and m.property_id = terms_acceptances.property_id
            and m.user_id = auth.uid() and m.role = 'tenant' and m.status = 'active')
);

-- Admin reporting. Only the service role may call these; the API gates them behind the admin role.
-- Money figures use the most common property currency so totals are never mixed across currencies.
create or replace function public.platform_currency()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select currency::text from public.properties group by currency order by count(*) desc, currency limit 1),
    'UGX'
  );
$$;

create or replace function public.admin_platform_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  with months as (
    select generate_series(
      date_trunc('month', now()) - interval '11 months',
      date_trunc('month', now()),
      interval '1 month'
    ) as m
  ),
  paid as (
    select p.amount, p.method, p.paid_at
    from public.payments p
    join public.properties pr on pr.id = p.property_id
    where p.status = 'completed' and pr.currency = public.platform_currency()
  )
  select jsonb_build_object(
    'currency', public.platform_currency(),
    'otherCurrencies', (
      select coalesce(jsonb_agg(distinct currency::text), '[]'::jsonb)
      from public.properties where currency <> public.platform_currency()
    ),
    'totals', jsonb_build_object(
      'landlords', (select count(*) from public.profiles where role = 'landlord'),
      'caretakers', (select count(*) from public.profiles where role = 'caretaker'),
      'tenants', (select count(*) from public.property_members where role = 'tenant' and status = 'active'),
      'properties', (select count(*) from public.properties),
      'units', (select count(*) from public.units),
      'collectedAllTime', (select coalesce(sum(amount), 0) from paid),
      'collectedThisMonth', (
        select coalesce(sum(amount), 0) from paid where paid_at >= date_trunc('month', now())
      ),
      'outstanding', (
        select coalesce(sum(greatest(
          c.amount - coalesce((select sum(p.amount) from public.payments p
                               where p.charge_id = c.id and p.status = 'completed'), 0), 0)), 0)
        from public.charges c
        join public.properties pr on pr.id = c.property_id
        where c.status in ('pending', 'partial', 'overdue') and pr.currency = public.platform_currency()
      )
    ),
    'monthly', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'collected', coalesce((select sum(amount) from paid where date_trunc('month', paid_at) = m), 0),
        'newLandlords', (select count(*) from public.profiles
                         where role = 'landlord' and date_trunc('month', created_at) = m),
        'newProperties', (select count(*) from public.properties where date_trunc('month', created_at) = m),
        'newTenants', (select count(*) from public.property_members
                       where role = 'tenant' and date_trunc('month', created_at) = m)
      ) order by m)
      from months
    ),
    'byType', (
      select coalesce(jsonb_agg(jsonb_build_object('label', property_type, 'count', c) order by c desc), '[]'::jsonb)
      from (select property_type::text, count(*) as c from public.properties group by 1) t
    ),
    'byLocation', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'city', city, 'country', country, 'properties', c, 'units', u) order by c desc, city), '[]'::jsonb)
      from (
        select coalesce(nullif(trim(pr.city), ''), 'Unknown') as city,
               coalesce(nullif(trim(pr.country), ''), 'Unknown') as country,
               count(distinct pr.id) as c,
               count(un.id) as u
        from public.properties pr
        left join public.units un on un.property_id = pr.id
        group by 1, 2
        order by c desc, 1
        limit 12
      ) l
    ),
    'byMethod', (
      select coalesce(jsonb_agg(jsonb_build_object('label', method, 'amount', total) order by total desc), '[]'::jsonb)
      from (select method::text, sum(amount) as total from paid group by 1) x
    )
  );
$$;

create or replace function public.admin_landlords()
returns table (
  id uuid, full_name text, email text, created_at timestamptz,
  properties bigint, units bigint, tenants bigint, collected numeric
) language sql stable security definer set search_path = public as $$
  select
    l.id, l.full_name, l.email, l.created_at,
    (select count(*) from public.properties pr where pr.owner_id = l.id),
    (select count(*) from public.units un join public.properties pr on pr.id = un.property_id
      where pr.owner_id = l.id),
    (select count(*) from public.property_members m join public.properties pr on pr.id = m.property_id
      where pr.owner_id = l.id and m.role = 'tenant' and m.status = 'active'),
    (select coalesce(sum(p.amount), 0) from public.payments p
      join public.properties pr on pr.id = p.property_id
      where pr.owner_id = l.id and p.status = 'completed' and pr.currency = public.platform_currency())
  from public.profiles l
  where l.role = 'landlord'
  order by 8 desc, l.created_at desc;
$$;

create or replace function public.admin_properties()
returns table (
  id uuid, name text, property_type text, address_line text, city text, state text, country text,
  currency text, created_at timestamptz, owner_id uuid, owner_name text, owner_email text,
  units bigint, tenants bigint, collected numeric, outstanding numeric
) language sql stable security definer set search_path = public as $$
  select
    pr.id, pr.name, pr.property_type::text, pr.address_line, pr.city, pr.state, pr.country,
    pr.currency::text, pr.created_at, pr.owner_id, o.full_name, o.email,
    (select count(*) from public.units un where un.property_id = pr.id),
    (select count(*) from public.property_members m
      where m.property_id = pr.id and m.role = 'tenant' and m.status = 'active'),
    (select coalesce(sum(p.amount), 0) from public.payments p
      where p.property_id = pr.id and p.status = 'completed'),
    (select coalesce(sum(greatest(
        c.amount - coalesce((select sum(p.amount) from public.payments p
                             where p.charge_id = c.id and p.status = 'completed'), 0), 0)), 0)
      from public.charges c
      where c.property_id = pr.id and c.status in ('pending', 'partial', 'overdue'))
  from public.properties pr
  join public.profiles o on o.id = pr.owner_id
  order by pr.created_at desc;
$$;

revoke execute on function public.platform_currency() from public, anon, authenticated;
revoke execute on function public.admin_platform_stats() from public, anon, authenticated;
revoke execute on function public.admin_landlords() from public, anon, authenticated;
revoke execute on function public.admin_properties() from public, anon, authenticated;
grant execute on function public.platform_currency() to service_role;
grant execute on function public.admin_platform_stats() to service_role;
grant execute on function public.admin_landlords() to service_role;
grant execute on function public.admin_properties() to service_role;

notify pgrst, 'reload schema';
