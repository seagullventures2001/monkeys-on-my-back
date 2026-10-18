-- Household (a Pro feature, unlocked while testing).
--
-- People who live together join one household. Each person keeps their own tree;
-- household members can SEE each other's trees and HAND a monkey to someone else,
-- but can't change or feed another person's monkeys.
--
-- Joining is by a single-use invite link that lasts 7 days. Every change to who is in
-- a household goes through the functions below; the tables can't be written directly.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  -- one household per person
  unique (user_id)
);

create table if not exists public.household_invites (
  token text primary key check (char_length(token) >= 32),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

-- Who handed a monkey over (null for monkeys you added yourself).
alter table public.monkeys add column if not exists handed_by uuid references auth.users (id) on delete set null;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies don't recurse; search_path pinned)
-- ---------------------------------------------------------------------------
create or replace function public.my_household()
returns uuid language sql stable security definer set search_path = '' as $$
  select household_id from public.household_members where user_id = (select auth.uid());
$$;

create or replace function public.shares_household_with(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.household_members mine
    join public.household_members theirs on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other
  );
$$;

-- A personal troop (tree) whose owner is in the signed-in user's household.
create or replace function public.is_household_troop(t uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.troops tr
    where tr.id = t and tr.is_personal and public.shares_household_with(tr.owner_id)
  );
$$;

-- Both troops are personal trees whose owners are in the same household.
create or replace function public.troops_share_household(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.troops ta
    join public.troops tb on tb.id = b
    join public.household_members ma on ma.user_id = ta.owner_id
    join public.household_members mb on mb.user_id = tb.owner_id and mb.household_id = ma.household_id
    where ta.id = a and ta.is_personal and tb.is_personal
  );
$$;

revoke execute on function public.my_household() from public, anon;
revoke execute on function public.shares_household_with(uuid) from public, anon;
revoke execute on function public.is_household_troop(uuid) from public, anon;
revoke execute on function public.troops_share_household(uuid, uuid) from public, anon;
grant execute on function public.my_household() to authenticated;
grant execute on function public.shares_household_with(uuid) to authenticated;
grant execute on function public.is_household_troop(uuid) to authenticated;
grant execute on function public.troops_share_household(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Monkeys: only a hand-over (between two trees in the same household) may move one,
-- and it records who handed it. Nobody can fake handed_by.
-- ---------------------------------------------------------------------------
create or replace function public.guard_monkey_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.troop_id <> old.troop_id then
    if not public.troops_share_household(old.troop_id, new.troop_id) then
      raise exception 'monkeys cannot change troop';
    end if;
    new.handed_by := (select auth.uid());
  elsif new.handed_by is distinct from old.handed_by then
    raise exception 'handed_by cannot change';
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

create or replace function public.clear_handed_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.handed_by := null;
  return new;
end;
$$;

drop trigger if exists monkeys_clear_handed_by on public.monkeys;
create trigger monkeys_clear_handed_by
before insert on public.monkeys
for each row execute function public.clear_handed_by();

-- ---------------------------------------------------------------------------
-- Read access
-- ---------------------------------------------------------------------------
drop policy if exists "households: members read" on public.households;
create policy "households: members read" on public.households
  for select to authenticated using (id = public.my_household());

drop policy if exists "household_members: members read" on public.household_members;
create policy "household_members: members read" on public.household_members
  for select to authenticated using (household_id = public.my_household());

-- (household_invites has no policies: only the functions below can touch it.)

drop policy if exists "troops: household reads personal" on public.troops;
create policy "troops: household reads personal" on public.troops
  for select to authenticated using (is_personal and public.shares_household_with(owner_id));

drop policy if exists "monkeys: household reads" on public.monkeys;
create policy "monkeys: household reads" on public.monkeys
  for select to authenticated using (public.is_household_troop(troop_id));

drop policy if exists "profiles: household reads" on public.profiles;
create policy "profiles: household reads" on public.profiles
  for select to authenticated using (public.shares_household_with(id));

-- ---------------------------------------------------------------------------
-- Actions
-- ---------------------------------------------------------------------------

-- Makes a single-use invite link token (and your household, if you don't have one yet).
create or replace function public.create_household_invite()
returns text language plpgsql security definer set search_path = '' as $$
declare
  h uuid;
  tok text;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in first';
  end if;
  h := public.my_household();
  if h is null then
    insert into public.households (created_by) values ((select auth.uid())) returning id into h;
    insert into public.household_members (household_id, user_id, role) values (h, (select auth.uid()), 'owner');
  end if;
  if (select count(*) from public.household_members where household_id = h) >= 6 then
    raise exception 'a household can have up to 6 people';
  end if;
  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.household_invites (token, household_id, created_by) values (tok, h, (select auth.uid()));
  return tok;
end;
$$;

-- What the join page shows before you accept: who invited you, and whether the link still works.
create or replace function public.household_invite_preview(tok text)
returns table (inviter_name text, inviter_avatar jsonb, member_count int, usable boolean)
language sql stable security definer set search_path = '' as $$
  select
    p.display_name,
    p.avatar,
    (select count(*)::int from public.household_members hm where hm.household_id = i.household_id),
    (i.used_at is null and i.expires_at > now())
  from public.household_invites i
  left join public.profiles p on p.id = i.created_by
  where i.token = tok;
$$;

create or replace function public.accept_household_invite(tok text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  inv public.household_invites;
  cur uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in first';
  end if;
  select * into inv from public.household_invites where token = tok for update;
  if inv.token is null or inv.used_at is not null or inv.expires_at <= now() then
    raise exception 'this invite link has expired or has already been used';
  end if;
  cur := public.my_household();
  if cur = inv.household_id then
    return cur;
  end if;
  if cur is not null then
    if (select count(*) from public.household_members where household_id = cur) > 1 then
      raise exception 'you are already in a household; leave it first';
    end if;
    -- A household with only you in it is simply replaced.
    delete from public.households where id = cur;
  end if;
  if (select count(*) from public.household_members where household_id = inv.household_id) >= 6 then
    raise exception 'that household is full';
  end if;
  insert into public.household_members (household_id, user_id) values (inv.household_id, (select auth.uid()));
  update public.household_invites set used_by = (select auth.uid()), used_at = now() where token = tok;
  return inv.household_id;
end;
$$;

create or replace function public.leave_household()
returns void language plpgsql security definer set search_path = '' as $$
declare
  h uuid;
begin
  h := public.my_household();
  if h is null then
    return;
  end if;
  delete from public.household_members where household_id = h and user_id = (select auth.uid());
  if not exists (select 1 from public.household_members where household_id = h) then
    delete from public.households where id = h;
  elsif not exists (select 1 from public.household_members where household_id = h and role = 'owner') then
    update public.household_members set role = 'owner'
    where household_id = h
      and user_id = (select user_id from public.household_members where household_id = h order by joined_at limit 1);
  end if;
end;
$$;

create or replace function public.remove_household_member(member uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  h uuid;
begin
  h := public.my_household();
  if h is null or not exists (
    select 1 from public.household_members where household_id = h and user_id = (select auth.uid()) and role = 'owner'
  ) then
    raise exception 'only the household owner can remove people';
  end if;
  if member = (select auth.uid()) then
    raise exception 'use leave instead';
  end if;
  delete from public.household_members where household_id = h and user_id = member;
end;
$$;

-- Moves one of your monkeys (still on your back) onto another household member's tree.
create or replace function public.hand_over_monkey(monkey uuid, to_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.monkeys;
  target uuid;
begin
  select * into m from public.monkeys where id = monkey;
  if m.id is null or not public.is_troop_member(m.troop_id) then
    raise exception 'monkey not found';
  end if;
  if m.fed_at is not null then
    raise exception 'only monkeys still on your back can be handed over';
  end if;
  if to_user = (select auth.uid()) or not public.shares_household_with(to_user) then
    raise exception 'that person is not in your household';
  end if;
  select id into target from public.troops
  where owner_id = to_user and is_personal
  order by created_at
  limit 1;
  if target is null then
    raise exception 'that person has no tree yet';
  end if;
  update public.monkeys set troop_id = target where id = monkey;
end;
$$;

revoke execute on function public.create_household_invite() from public, anon;
revoke execute on function public.accept_household_invite(text) from public, anon;
revoke execute on function public.leave_household() from public, anon;
revoke execute on function public.remove_household_member(uuid) from public, anon;
revoke execute on function public.hand_over_monkey(uuid, uuid) from public, anon;
revoke execute on function public.household_invite_preview(text) from public;
grant execute on function public.create_household_invite() to authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.remove_household_member(uuid) to authenticated;
grant execute on function public.hand_over_monkey(uuid, uuid) to authenticated;
grant execute on function public.household_invite_preview(text) to anon, authenticated;
