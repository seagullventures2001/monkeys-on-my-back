-- Avatars: each person's cartoon self, saved on their profile.
--
-- Stored as a small JSON object of item ids (body, hair, shirt ...), so new items can
-- be added later without another migration.
--
-- Who can see it: you, plus anyone you share a troop with (so in a household each
-- person's avatar can stand next to their own tree). Only you can change yours.

alter table public.profiles
  add column if not exists avatar jsonb
    check (avatar is null or (jsonb_typeof(avatar) = 'object' and pg_column_size(avatar) <= 2048)),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- True when the signed-in user and `other` are both members of at least one troop.
create or replace function public.shares_troop_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.troop_members mine
    join public.troop_members theirs on theirs.troop_id = mine.troop_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other
  );
$$;

revoke execute on function public.shares_troop_with(uuid) from public, anon;
grant execute on function public.shares_troop_with(uuid) to authenticated;

drop policy if exists "profiles: troop-mates read" on public.profiles;
create policy "profiles: troop-mates read" on public.profiles
  for select to authenticated using (public.shares_troop_with(id));

-- Profiles are made at sign-up, but let the app create its own if one is ever missing.
drop policy if exists "profiles: create own" on public.profiles;
create policy "profiles: create own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
