-- Caretaker role. Kept in its own file: a new enum value can't be used in the transaction that adds it.

alter type public.user_role add value if not exists 'caretaker';
alter type public.member_role add value if not exists 'caretaker';
