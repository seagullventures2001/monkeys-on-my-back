import type { SupabaseClient } from '@supabase/supabase-js'
import type { Effort, Monkey, NewMonkey } from '@/lib/monkey'
import type { EditableFields, MonkeyRepo } from './repo'

interface MonkeyRow {
  id: string
  troop_id: string
  title: string
  notes: string | null
  effort: Effort
  created_at: string
  fed_at: string | null
  due_on: string | null
}

const COLUMNS = 'id, troop_id, title, notes, effort, created_at, fed_at, due_on'

function toMonkey(row: MonkeyRow): Monkey {
  return {
    id: row.id,
    troopId: row.troop_id,
    title: row.title,
    notes: row.notes,
    effort: row.effort,
    createdAt: row.created_at,
    fedAt: row.fed_at,
    dueOn: row.due_on,
  }
}

/**
 * Talks to Supabase. Security is enforced by the database's row-level security rules
 * (see supabase/migrations), not by this code, so nothing here can leak another
 * person's monkeys even if it had a bug.
 */
export function createSupabaseRepo(client: SupabaseClient, troopId: string): MonkeyRepo {
  async function one(query: PromiseLike<{ data: MonkeyRow | null; error: { message: string } | null }>) {
    const { data, error } = await query
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Monkey not found')
    return toMonkey(data)
  }

  return {
    kind: 'supabase',

    async list() {
      const { data, error } = await client
        .from('monkeys')
        .select(COLUMNS)
        .eq('troop_id', troopId)
        .order('created_at', { ascending: true })
      if (error) throw new Error(error.message)
      return (data as MonkeyRow[]).map(toMonkey)
    },

    async add(input: NewMonkey) {
      const { data: userData } = await client.auth.getUser()
      return one(
        client
          .from('monkeys')
          .insert({
            troop_id: troopId,
            title: input.title.trim(),
            notes: input.notes?.trim() || null,
            effort: input.effort,
            due_on: input.dueOn ?? null,
            created_by: userData.user?.id,
            ...(input.createdAt ? { created_at: input.createdAt } : {}),
          })
          .select(COLUMNS)
          .single(),
      )
    },

    async update(id: string, patch: EditableFields) {
      const { dueOn, ...rest } = patch
      const row = dueOn === undefined ? rest : { ...rest, due_on: dueOn }
      return one(client.from('monkeys').update(row).eq('id', id).select(COLUMNS).single())
    },

    async feed(id: string) {
      return one(
        client.from('monkeys').update({ fed_at: new Date().toISOString() }).eq('id', id).select(COLUMNS).single(),
      )
    },

    async unfeed(id: string) {
      return one(client.from('monkeys').update({ fed_at: null }).eq('id', id).select(COLUMNS).single())
    },

    async remove(id: string) {
      const { error } = await client.from('monkeys').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
  }
}

/**
 * The signed-in user's own personal troop (created automatically on sign-up).
 * Filtered by owner too, because once troops are shared you can also see other
 * people's personal troops.
 */
export async function fetchPersonalTroopId(client: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await client
    .from('troops')
    .select('id')
    .eq('is_personal', true)
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}
