-- Optional due dates for monkeys.
-- A plain calendar day (no time), so "due Saturday" means Saturday wherever you are.
-- Existing monkeys simply have no due date. Row-level security already covers this column.

alter table public.monkeys add column if not exists due_on date;

create index if not exists monkeys_troop_due_idx
  on public.monkeys (troop_id, due_on)
  where fed_at is null and due_on is not null;
