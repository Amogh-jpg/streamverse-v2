-- Phase 2 — User Profiles, Reviews, Custom Collections.
-- The base tables and RLS already exist (0001_init.sql, 0002_rls.sql). This
-- migration adds the columns, constraints, indexes and triggers the Phase 2
-- feature work relies on. Everything is written to be idempotent so it can be
-- re-applied safely.

-- --- Profiles ---------------------------------------------------------------
-- A short, user-editable bio for the public profile, plus an updated_at stamp.
alter table public.profiles
  add column if not exists bio text;
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- Keep public slugs sane and URL-safe (lowercase letters, digits, hyphens).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_public_slug_format'
  ) then
    alter table public.profiles
      add constraint profiles_public_slug_format
      check (public_slug is null or public_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');
  end if;
end $$;

-- --- Reviews ----------------------------------------------------------------
alter table public.reviews
  add column if not exists updated_at timestamptz not null default now();

-- One review per user per title; enables upsert (edit) semantics.
create unique index if not exists reviews_user_media_uidx
  on public.reviews (user_id, media_type, media_id);
create index if not exists reviews_user_idx
  on public.reviews (user_id, created_at desc);

-- --- Collections ------------------------------------------------------------
alter table public.collections
  add column if not exists description text;
alter table public.collections
  add column if not exists updated_at timestamptz not null default now();

create index if not exists collections_user_idx
  on public.collections (user_id, created_at desc);
create index if not exists collection_items_collection_idx
  on public.collection_items (collection_id);

-- A title can only appear once in a given collection.
create unique index if not exists collection_items_unique_uidx
  on public.collection_items (collection_id, media_type, media_id);

-- --- updated_at trigger -----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();
