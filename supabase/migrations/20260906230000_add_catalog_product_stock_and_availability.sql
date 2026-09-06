alter table public.catalog_products
  add column if not exists management_type text not null default 'none',
  add column if not exists stock_quantity integer,
  add column if not exists low_stock_threshold integer not null default 3,
  add column if not exists rental_price text,
  add column if not exists rental_deposit text;

alter table public.catalog_products drop constraint if exists catalog_products_management_type_check;
alter table public.catalog_products add constraint catalog_products_management_type_check
  check (management_type in ('none', 'stock', 'rental'));
alter table public.catalog_products drop constraint if exists catalog_products_stock_quantity_check;
alter table public.catalog_products add constraint catalog_products_stock_quantity_check
  check (stock_quantity is null or stock_quantity >= 0);
alter table public.catalog_products drop constraint if exists catalog_products_low_stock_threshold_check;
alter table public.catalog_products add constraint catalog_products_low_stock_threshold_check
  check (low_stock_threshold >= 0);

create table if not exists public.catalog_product_unavailability (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint catalog_product_unavailability_dates_check check (end_date >= start_date)
);

create index if not exists catalog_product_unavailability_product_dates_idx
  on public.catalog_product_unavailability(product_id, start_date, end_date);

alter table public.catalog_product_unavailability enable row level security;
grant select, insert, delete on public.catalog_product_unavailability to anon, authenticated;

drop policy if exists "catalog availability readable by anyone" on public.catalog_product_unavailability;
create policy "catalog availability readable by anyone"
  on public.catalog_product_unavailability for select to anon, authenticated using (true);

drop policy if exists "catalog availability insertable from management" on public.catalog_product_unavailability;
create policy "catalog availability insertable from management"
  on public.catalog_product_unavailability for insert to anon, authenticated with check (true);

drop policy if exists "catalog availability deletable from management" on public.catalog_product_unavailability;
create policy "catalog availability deletable from management"
  on public.catalog_product_unavailability for delete to anon, authenticated using (true);

