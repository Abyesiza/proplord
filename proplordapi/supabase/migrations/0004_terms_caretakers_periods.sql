-- Terms and conditions, caretaker access, and payment frequency with the periods a payment covers.

-- Terms: null `terms` means the app's default clauses; `terms_enabled` switches them off.
alter table public.properties
  add column terms jsonb check (terms is null or jsonb_typeof(terms) = 'array'),
  add column terms_enabled boolean not null default true;

-- Payment frequency per tenant; `agreed_amount` overrides the per-period amount worked out from unit rent.
create type public.payment_frequency as enum ('biweekly', 'monthly', 'quarterly', 'semiannual', 'annual');

alter table public.property_members
  add column payment_frequency public.payment_frequency not null default 'monthly',
  add column agreed_amount numeric(12, 2) check (agreed_amount is null or agreed_amount > 0);

-- A payment can cover a run of periods; period_end is exclusive.
alter table public.payments
  add column frequency public.payment_frequency,
  add column period_start date,
  add column period_count integer check (period_count is null or period_count > 0),
  add column period_end date,
  add constraint payments_period_complete check (
    (frequency is null and period_start is null and period_count is null and period_end is null)
    or (frequency is not null and period_start is not null and period_count is not null
        and period_end is not null and period_end > period_start)
  );
create index payments_member_period_idx on public.payments (member_id, period_start)
  where period_start is not null;

-- Staff = the owner or an active caretaker of the property.
create or replace function public.is_property_staff(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties where id = pid and owner_id = auth.uid())
      or exists (
        select 1 from public.property_members
        where property_id = pid and user_id = auth.uid()
          and status = 'active' and role = 'caretaker'
      );
$$;

-- Staff can read what they follow up on.
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.property_members m
    where m.user_id = profiles.id and public.is_property_staff(m.property_id)
  )
);

drop policy members_select on public.property_members;
create policy members_select on public.property_members for select to authenticated
  using (public.is_property_staff(property_id) or user_id = auth.uid());

drop policy charges_select on public.charges;
create policy charges_select on public.charges for select to authenticated using (
  public.is_property_staff(property_id)
  or exists (select 1 from public.property_members m
             where m.id = charges.member_id and m.user_id = auth.uid())
);

drop policy payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated using (
  public.is_property_staff(property_id)
  or exists (select 1 from public.property_members m
             where m.id = payments.member_id and m.user_id = auth.uid())
);

drop policy receipts_select on public.receipts;
create policy receipts_select on public.receipts for select to authenticated using (
  public.is_property_staff(property_id)
  or exists (
    select 1 from public.payments p
    join public.property_members m on m.id = p.member_id
    where p.id = receipts.payment_id and m.user_id = auth.uid()
  )
);

-- Caretakers may raise charges and record payments, but not edit or cancel them.
create policy charges_staff_insert on public.charges for insert to authenticated
  with check (public.is_property_staff(property_id));
create policy payments_staff_insert on public.payments for insert to authenticated
  with check (public.is_property_staff(property_id));

notify pgrst, 'reload schema';
