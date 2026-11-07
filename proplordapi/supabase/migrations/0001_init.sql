-- Proplord initial schema: profiles, properties, units, members, invitations, charges, payments, receipts.

create extension if not exists pgcrypto;

-- Enums
create type public.user_role as enum ('landlord', 'tenant');
create type public.member_role as enum ('tenant', 'manager');
create type public.member_status as enum ('active', 'inactive');
create type public.member_origin as enum ('invite', 'credentials');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.charge_status as enum ('pending', 'partial', 'paid', 'overdue', 'cancelled');
create type public.payment_method as enum ('cash', 'bank_transfer', 'mobile_money', 'card', 'other');
create type public.payment_status as enum ('pending', 'completed', 'failed', 'refunded');

-- Shared trigger: keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tenant',
  full_name text,
  email text,
  username text unique check (username is null or username ~ '^[a-z0-9_.-]{3,32}$'),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile for every new auth user; metadata may carry role/full_name/username
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, username, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'tenant')
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  address_line text,
  city text,
  state text,
  country text,
  currency char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_owner_idx on public.properties (owner_id);
create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- Units (apartments, rooms, shops) inside a property
create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  rent_amount numeric(12, 2) not null default 0 check (rent_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, name)
);
create trigger units_updated_at before update on public.units
  for each row execute function public.set_updated_at();

-- Members: users attached to a property
create table public.property_members (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  role public.member_role not null default 'tenant',
  status public.member_status not null default 'active',
  origin public.member_origin not null default 'invite',
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);
create index property_members_user_idx on public.property_members (user_id);

-- Invitations by email (token is stored hashed; the raw token is only emailed)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  role public.member_role not null default 'tenant',
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_property_idx on public.invitations (property_id);
create unique index invitations_one_pending_idx
  on public.invitations (property_id, lower(email)) where status = 'pending';

-- Charges (rent and other dues)
create table public.charges (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  member_id uuid not null references public.property_members (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date not null,
  status public.charge_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index charges_property_idx on public.charges (property_id);
create index charges_member_idx on public.charges (member_id);
create trigger charges_updated_at before update on public.charges
  for each row execute function public.set_updated_at();

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  member_id uuid not null references public.property_members (id) on delete cascade,
  charge_id uuid references public.charges (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null default 'cash',
  status public.payment_status not null default 'completed',
  reference text,
  note text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index payments_property_idx on public.payments (property_id);
create index payments_member_idx on public.payments (member_id);
create index payments_charge_idx on public.payments (charge_id);

-- Receipts (one per completed payment)
create sequence public.receipt_number_seq;
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  receipt_number text not null unique
    default 'RCT-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0'),
  issued_at timestamptz not null default now()
);
create index receipts_property_idx on public.receipts (property_id);

-- Issue a receipt when a payment is completed
create or replace function public.issue_receipt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed'
     and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    insert into public.receipts (payment_id, property_id)
    values (new.id, new.property_id)
    on conflict (payment_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger payments_issue_receipt after insert or update of status on public.payments
  for each row execute function public.issue_receipt();

-- Keep charge status in sync with completed payments
create or replace function public.sync_charge_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cid uuid := coalesce(new.charge_id, old.charge_id);
  total numeric(12, 2);
  due numeric(12, 2);
begin
  if cid is null then
    return coalesce(new, old);
  end if;
  select amount into due from public.charges where id = cid;
  select coalesce(sum(amount), 0) into total
    from public.payments where charge_id = cid and status = 'completed';
  update public.charges
    set status = case
      when status = 'cancelled' then status
      when total >= due then 'paid'
      when total > 0 then 'partial'
      else 'pending'
    end
    where id = cid;
  return coalesce(new, old);
end;
$$;
create trigger payments_sync_charge after insert or update or delete on public.payments
  for each row execute function public.sync_charge_status();

-- Access helpers (security definer avoids RLS recursion)
create or replace function public.is_property_owner(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties where id = pid and owner_id = auth.uid());
$$;

create or replace function public.is_property_member(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.property_members
    where property_id = pid and user_id = auth.uid() and status = 'active'
  );
$$;

-- Row level security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.property_members enable row level security;
alter table public.invitations enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;

-- profiles: self, plus members of properties you own
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.property_members m
    where m.user_id = profiles.id and public.is_property_owner(m.property_id)
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- properties: owners manage, members read
create policy properties_select on public.properties for select to authenticated
  using (owner_id = auth.uid() or public.is_property_member(id));
create policy properties_insert on public.properties for insert to authenticated
  with check (owner_id = auth.uid());
create policy properties_update on public.properties for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy properties_delete on public.properties for delete to authenticated
  using (owner_id = auth.uid());

-- units
create policy units_select on public.units for select to authenticated
  using (public.is_property_owner(property_id) or public.is_property_member(property_id));
create policy units_write on public.units for all to authenticated
  using (public.is_property_owner(property_id)) with check (public.is_property_owner(property_id));

-- property_members: owner manages; a member sees their own row
create policy members_select on public.property_members for select to authenticated
  using (public.is_property_owner(property_id) or user_id = auth.uid());
create policy members_write on public.property_members for all to authenticated
  using (public.is_property_owner(property_id)) with check (public.is_property_owner(property_id));

-- invitations: owner only (acceptance runs server-side)
create policy invitations_owner on public.invitations for all to authenticated
  using (public.is_property_owner(property_id)) with check (public.is_property_owner(property_id));

-- charges: owner manages; tenant reads own
create policy charges_select on public.charges for select to authenticated using (
  public.is_property_owner(property_id)
  or exists (select 1 from public.property_members m
             where m.id = charges.member_id and m.user_id = auth.uid())
);
create policy charges_write on public.charges for all to authenticated
  using (public.is_property_owner(property_id)) with check (public.is_property_owner(property_id));

-- payments: owner manages; tenant reads own
create policy payments_select on public.payments for select to authenticated using (
  public.is_property_owner(property_id)
  or exists (select 1 from public.property_members m
             where m.id = payments.member_id and m.user_id = auth.uid())
);
create policy payments_write on public.payments for all to authenticated
  using (public.is_property_owner(property_id)) with check (public.is_property_owner(property_id));

-- receipts: read-only for owner and the paying tenant (issued by trigger)
create policy receipts_select on public.receipts for select to authenticated using (
  public.is_property_owner(property_id)
  or exists (
    select 1 from public.payments p
    join public.property_members m on m.id = p.member_id
    where p.id = receipts.payment_id and m.user_id = auth.uid()
  )
);
