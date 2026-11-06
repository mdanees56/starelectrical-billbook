-- STAR ELECTRICAL HAZARIBAGH - shared cloud storage
-- Run this once in Supabase Dashboard > SQL Editor.

create table if not exists public.shop_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  store text not null check (store in ('products', 'customers', 'invoices')),
  record_id uuid not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, store, record_id)
);

alter table public.shop_records enable row level security;
alter table public.shop_records replica identity full;
revoke all on public.shop_records from anon;
grant select, insert, update, delete on public.shop_records to authenticated;

drop policy if exists "shop owner can read records" on public.shop_records;
drop policy if exists "shop owner can add records" on public.shop_records;
drop policy if exists "shop owner can update records" on public.shop_records;
drop policy if exists "shop owner can delete records" on public.shop_records;

create policy "shop owner can read records" on public.shop_records for select to authenticated using ((select auth.uid()) = owner_id);
create policy "shop owner can add records" on public.shop_records for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "shop owner can update records" on public.shop_records for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "shop owner can delete records" on public.shop_records for delete to authenticated using ((select auth.uid()) = owner_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shop_records') then
    alter publication supabase_realtime add table public.shop_records;
  end if;
end $$;
