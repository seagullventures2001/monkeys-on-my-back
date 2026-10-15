-- Monkeys on My Back: initial schema
--
-- Model: every user gets a personal "troop" on sign-up. Monkeys belong to a troop,
-- not to a user, so household sharing later is just adding rows to troop_members.
--
-- Security: row-level security is ON for every table. A user can only see or change
-- troops they are a member of, and the monkeys in them.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.effort as enum ('quick', 'hour', 'half', 'full', 'ongoing');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.troops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.troop_members (
  troop_id uuid not null references public.troops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (troop_id, user_id)
);

create index troop_members_user_idx on public.troop_members (user_id);

create table public.monkeys (
  id uuid primary key default gen_random_uuid(),
  troop_id uuid not null references public.troops (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  notes text check (char_length(notes) <= 2000),
  effort public.effort not null default 'hour',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  fed_at timestamptz,
  fed_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index monkeys_troop_waiting_idx on public.monkeys (troop_id, created_at) where fed_at is null;
create index monkeys_troop_fed_idx on public.monkeys (troop_id, fed_at desc) where fed_at is not null;

-- ---------------------------------------------------------------------------
-- Helper functions
-- security definer so policies can check membership without recursing through
-- troop_members' own policies. search_path is pinned to stop hijacking.
-- ---------------------------------------------------------------------------
create function public.is_troop_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.troop_members
    where troop_id = t and user_id = (select auth.uid())
  );
$$;

create function public.is_troop_owner(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.troops
    where id = t and owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_troop_member(uuid) from public, anon;
revoke execute on function public.is_troop_owner(uuid) from public, anon;
grant execute on function public.is_troop_member(uuid) to authenticated;
grant execute on function public.is_troop_owner(uuid) to authenticated;

-- Keep updated_at honest.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger monkeys_touch_updated_at
before update on public.monkeys
for each row execute function public.touch_updated_at();

-- Monkeys cannot be moved between troops, and their creator cannot be rewritten.
create function public.guard_monkey_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.troop_id <> old.troop_id then
    raise exception 'monkeys cannot change troop';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot change';
  end if;
  -- fed_by always records who actually fed it, whatever the client sends.
  if new.fed_at is null then
    new.fed_by := null;
  elsif old.fed_at is null then
    new.fed_by := (select auth.uid());
  else
    new.fed_by := old.fed_by;
  end if;
  return new;
end;
$$;

create trigger monkeys_guard_update
before update on public.monkeys
for each row execute function public.guard_monkey_update();

-- New user -> profile + personal troop + owner membership.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_troop uuid;
begin
  insert into public.profiles (id) values (new.id);

  insert into public.troops (name, owner_id, is_personal)
  values ('My troop', new.id, true)
  returning id into new_troop;

  insert into public.troop_members (troop_id, user_id, role)
  values (new_troop, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.troops enable row level security;
alter table public.troop_members enable row level security;
alter table public.monkeys enable row level security;

-- profiles: you see and edit your own.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- troops: members can read; anyone signed in can create one they own; only the owner changes or deletes it.
create policy "troops: members read" on public.troops
  for select to authenticated using (public.is_troop_member(id) or owner_id = (select auth.uid()));
create policy "troops: create own" on public.troops
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "troops: owner updates" on public.troops
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "troops: owner deletes non-personal" on public.troops
  for delete to authenticated using (owner_id = (select auth.uid()) and not is_personal);

-- troop_members: members see who else is in the troop; the owner adds or removes people;
-- anyone can leave a troop they do not own.
create policy "members: members read" on public.troop_members
  for select to authenticated using (public.is_troop_member(troop_id));
create policy "members: owner adds" on public.troop_members
  for insert to authenticated with check (public.is_troop_owner(troop_id));
create policy "members: owner removes or self leaves" on public.troop_members
  for delete to authenticated using (
    public.is_troop_owner(troop_id)
    or (user_id = (select auth.uid()) and not public.is_troop_owner(troop_id))
  );

-- monkeys: full access for troop members, nothing for anyone else.
create policy "monkeys: members read" on public.monkeys
  for select to authenticated using (public.is_troop_member(troop_id));
create policy "monkeys: members add" on public.monkeys
  for insert to authenticated with check (
    public.is_troop_member(troop_id) and created_by = (select auth.uid())
  );
create policy "monkeys: members update" on public.monkeys
  for update to authenticated using (public.is_troop_member(troop_id)) with check (public.is_troop_member(troop_id));
create policy "monkeys: members delete" on public.monkeys
  for delete to authenticated using (public.is_troop_member(troop_id));
