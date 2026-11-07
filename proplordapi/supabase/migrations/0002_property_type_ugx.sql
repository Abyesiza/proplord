-- Property kinds, and Ugandan shillings as the default currency.

create type public.property_type as enum (
  'apartments',
  'rental_rooms',
  'house',
  'hostel',
  'commercial',
  'mixed_use',
  'other'
);

alter table public.properties
  add column property_type public.property_type not null default 'apartments';

alter table public.properties alter column currency set default 'UGX';

-- Properties created before this change defaulted to USD.
update public.properties set currency = 'UGX' where currency = 'USD';
