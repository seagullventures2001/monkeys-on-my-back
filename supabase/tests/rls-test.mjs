// Runs the migration against an in-process Postgres with a minimal fake of Supabase's
// auth schema, then checks the row-level security rules as two different users.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

// Every migration file passed on the command line, applied in order.
const migrations = process.argv.slice(2).sort().map((f) => readFileSync(f, 'utf8'))
const db = new PGlite()

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`)

for (const m of migrations) await db.exec(m)

await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
`)

const A = '11111111-1111-1111-1111-111111111111'
const B = '22222222-2222-2222-2222-222222222222'
await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@x.test'), ('${B}', 'b@x.test');`)

let failures = 0
function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
  if (!cond) failures++
}

async function as(user, sql) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false); set role ${user ? 'authenticated' : 'anon'};`)
  try {
    return await db.query(sql)
  } finally {
    await db.exec('reset role;')
  }
}
async function fails(user, sql) {
  try {
    await as(user, sql)
    return false
  } catch {
    return true
  }
}

const troopsA = await as(A, 'select id, is_personal from public.troops')
check('signup trigger made one personal troop for A', troopsA.rows.length === 1 && troopsA.rows[0].is_personal)
const troopA = troopsA.rows[0].id
const troopB = (await as(B, 'select id from public.troops')).rows[0].id

const added = await as(A, `insert into public.monkeys (troop_id, title, effort) values ('${troopA}', 'Clean the BBQ', 'hour') returning id, created_by`)
check('A can add a monkey to own troop', added.rows.length === 1 && added.rows[0].created_by === A)
const monkeyA = added.rows[0].id

const dated = await as(A, `insert into public.monkeys (troop_id, title, due_on) values ('${troopA}', 'Mow before the party', '2026-10-24') returning due_on`)
check('A can add a monkey with a due date', dated.rows.length === 1 && dated.rows[0].due_on !== null)
check('B cannot see A\'s dated monkey', (await as(B, `select * from public.monkeys where due_on is not null`)).rows.length === 0)

check('A cannot add a monkey to B\'s troop', await fails(A, `insert into public.monkeys (troop_id, title) values ('${troopB}', 'sneaky')`))
check('A cannot fake created_by', await fails(A, `insert into public.monkeys (troop_id, title, created_by) values ('${troopA}', 'x', '${B}')`))

check('B cannot see A\'s monkeys', (await as(B, 'select * from public.monkeys')).rows.length === 0)
check('B cannot see A\'s troop', (await as(B, `select * from public.troops where id = '${troopA}'`)).rows.length === 0)
check('anon sees nothing', (await as(null, 'select * from public.monkeys')).rows.length === 0)

const bUpdate = await as(B, `update public.monkeys set title = 'hacked' where id = '${monkeyA}' returning id`)
check('B cannot update A\'s monkey', bUpdate.rows.length === 0)
const bDelete = await as(B, `delete from public.monkeys where id = '${monkeyA}' returning id`)
check('B cannot delete A\'s monkey', bDelete.rows.length === 0)

check('B cannot add themselves to A\'s troop', await fails(B, `insert into public.troop_members (troop_id, user_id) values ('${troopA}', '${B}')`))

const fed = await as(A, `update public.monkeys set fed_at = now(), fed_by = '${B}' where id = '${monkeyA}' returning fed_by`)
check('feeding records the real feeder, not the value sent', fed.rows[0]?.fed_by === A)

check('monkeys cannot move troops', await fails(A, `update public.monkeys set troop_id = '${troopB}' where id = '${monkeyA}'`))

// Avatars on profiles
const av = `'{"body":"female","hair":"bob"}'::jsonb`
check('A can save an avatar', (await as(A, `update public.profiles set avatar = ${av} where id = '${A}' returning id`)).rows.length === 1)
check('A can read own avatar', (await as(A, `select avatar from public.profiles where id = '${A}'`)).rows[0]?.avatar?.body === 'female')
check('B cannot see A\'s avatar', (await as(B, `select * from public.profiles where id = '${A}'`)).rows.length === 0)
check('B cannot change A\'s avatar', (await as(B, `update public.profiles set avatar = '{}'::jsonb where id = '${A}' returning id`)).rows.length === 0)
check('an avatar must be an object', await fails(A, `update public.profiles set avatar = '"male"'::jsonb where id = '${A}'`))
check('B cannot create a profile for A', await fails(B, `insert into public.profiles (id) values ('${A}')`))

// Sharing: A invites B into A's troop.
await as(A, `insert into public.troop_members (troop_id, user_id) values ('${troopA}', '${B}')`)
check('after sharing, B sees A\'s avatar', (await as(B, `select avatar from public.profiles where id = '${A}'`)).rows[0]?.avatar?.hair === 'bob')
check('after sharing, B still cannot change A\'s avatar', (await as(B, `update public.profiles set avatar = '{}'::jsonb where id = '${A}' returning id`)).rows.length === 0)
check('after sharing, B sees A\'s monkeys', (await as(B, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length === 2)
check('B can add to the shared troop', (await as(B, `insert into public.monkeys (troop_id, title) values ('${troopA}', 'Trim tree') returning id`)).rows.length === 1)
const leave = await as(B, `delete from public.troop_members where troop_id = '${troopA}' and user_id = '${B}' returning user_id`)
check('B can leave the shared troop', leave.rows.length === 1)
check('after leaving, B sees nothing of A\'s', (await as(B, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length === 0)
check('after leaving, B cannot see A\'s avatar', (await as(B, `select * from public.profiles where id = '${A}'`)).rows.length === 0)

const ownerLeave = await as(A, `delete from public.troop_members where troop_id = '${troopB}' and user_id = '${B}' returning user_id`)
check('A cannot remove B from B\'s troop', ownerLeave.rows.length === 0)
const delPersonal = await as(A, `delete from public.troops where id = '${troopA}' returning id`)
check('personal troop cannot be deleted', delPersonal.rows.length === 0)

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------
const C = '33333333-3333-3333-3333-333333333333'
await db.exec(`insert into auth.users (id, email) values ('${C}', 'c@x.test');`)
const troopC = (await as(C, 'select id from public.troops')).rows[0].id
const one = async (user, sql) => (await as(user, sql)).rows[0]

check('anon cannot make an invite', await fails(null, 'select public.create_household_invite()'))
const tok1 = (await one(A, 'select public.create_household_invite() as t')).t
check('A can make an invite link', typeof tok1 === 'string' && tok1.length >= 32)
check('A is now a household owner', (await one(A, `select role from public.household_members where user_id = '${A}'`))?.role === 'owner')
check('nobody can read invites directly', (await as(A, 'select * from public.household_invites')).rows.length === 0)
const hA = (await db.query(`select household_id from public.household_members where user_id = '${A}'`)).rows[0].household_id
check('nobody can add themselves to a household directly', await fails(B, `insert into public.household_members (household_id, user_id) values ('${hA}', '${B}')`))
check('nobody can make themselves owner directly', (await as(A, `update public.household_members set role = 'owner' returning user_id`)).rows.length === 0)
const preview = await one(null, `select * from public.household_invite_preview('${tok1}')`)
check('the join page can preview a valid invite before sign-in', preview?.usable === true && preview?.member_count === 1)
check('a wrong token previews nothing', (await as(null, `select * from public.household_invite_preview('${'x'.repeat(64)}')`)).rows.length === 0)

check('before joining, B cannot see A\'s tree', (await as(B, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length === 0)
check('B can accept the invite', (await as(B, `select public.accept_household_invite('${tok1}')`)).rows.length === 1)
check('the invite only works once', await fails(C, `select public.accept_household_invite('${tok1}')`))
check('after joining, B sees A\'s monkeys', (await as(B, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length >= 1)
check('after joining, A sees B\'s tree', (await as(A, `select * from public.troops where id = '${troopB}'`)).rows.length === 1)
check('household members see each other\'s profile', (await as(B, `select * from public.profiles where id = '${A}'`)).rows.length === 1)
check('both are listed as members', (await as(B, 'select * from public.household_members')).rows.length === 2)
check('C (outside) sees nothing of the household', (await as(C, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length === 0 && (await as(C, 'select * from public.household_members')).rows.length === 0)

const bEdit = await as(B, `update public.monkeys set title = 'hacked' where troop_id = '${troopA}' returning id`)
check('B cannot change A\'s monkeys', bEdit.rows.length === 0)
const bFeed = await as(B, `update public.monkeys set fed_at = now() where troop_id = '${troopA}' returning id`)
check('B cannot feed A\'s monkeys', bFeed.rows.length === 0)
check('B cannot delete A\'s monkeys', (await as(B, `delete from public.monkeys where troop_id = '${troopA}' returning id`)).rows.length === 0)
check('nobody can move a monkey by editing it directly', await fails(A, `update public.monkeys set troop_id = '${troopB}' where id = '${monkeyA}'`) || (await as(A, `select troop_id from public.monkeys where id = '${monkeyA}'`)).rows[0].troop_id === troopA)
check('nobody can fake handed_by on a new monkey', (await one(A, `insert into public.monkeys (troop_id, title, handed_by) values ('${troopA}', 'Fake', '${B}') returning handed_by`)).handed_by === null)

const give = (await one(A, `insert into public.monkeys (troop_id, title) values ('${troopA}', 'Clean gutters') returning id`)).id
check('A cannot hand a monkey to C (not in the household)', await fails(A, `select public.hand_over_monkey('${give}', '${C}')`))
check('B cannot hand over A\'s monkey', await fails(B, `select public.hand_over_monkey('${give}', '${B}')`))
await as(A, `select public.hand_over_monkey('${give}', '${B}')`)
const moved = await one(B, `select troop_id, handed_by, created_by from public.monkeys where id = '${give}'`)
check('A can hand a monkey to B; it lands on B\'s tree', moved?.troop_id === troopB)
check('it records who handed it over', moved?.handed_by === A)
check('B can now feed the handed-over monkey', (await as(B, `update public.monkeys set fed_at = now() where id = '${give}' returning id`)).rows.length === 1)
check('fed monkeys cannot be handed over', await fails(B, `select public.hand_over_monkey('${give}', '${A}')`))

check('only the owner can remove people', await fails(B, `select public.remove_household_member('${A}')`))
const tok2 = (await one(A, 'select public.create_household_invite() as t')).t
await db.exec(`update public.household_invites set expires_at = now() - interval '1 minute' where token = '${tok2}'`)
check('expired invites do not work', await fails(C, `select public.accept_household_invite('${tok2}')`))

await as(B, 'select public.leave_household()')
check('after leaving, B cannot see A\'s tree', (await as(B, `select * from public.monkeys where troop_id = '${troopA}'`)).rows.length === 0)
check('after leaving, A cannot see B\'s tree', (await as(A, `select * from public.monkeys where troop_id = '${troopB}'`)).rows.length === 0)
await as(A, 'select public.leave_household()')
check('the last person leaving removes the household', (await db.query('select * from public.households')).rows.length === 0)

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
