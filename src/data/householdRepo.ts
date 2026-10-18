import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeAvatar, type Avatar } from '@/lib/avatar'
import type { Monkey } from '@/lib/monkey'
import { COLUMNS, toMonkey, type MonkeyRow } from './supabaseRepo'

/**
 * Household: people who live together, each with their own tree.
 * The database's security rules decide who can see what (see the household migration);
 * changes to membership only happen through its functions.
 */
export interface Member {
  userId: string
  role: 'owner' | 'member'
  name: string | null
  avatar: Avatar | null
  troopId: string | null
  joinedAt: string
}

export interface Household {
  id: string
  members: Member[]
}

export interface InvitePreview {
  inviterName: string | null
  inviterAvatar: Avatar | null
  memberCount: number
  usable: boolean
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export async function fetchHousehold(client: SupabaseClient): Promise<Household | null> {
  const { data: rows, error } = await client.from('household_members').select('household_id, user_id, role, joined_at')
  fail(error)
  const members = (rows ?? []) as { household_id: string; user_id: string; role: 'owner' | 'member'; joined_at: string }[]
  if (members.length === 0) return null
  const ids = members.map((m) => m.user_id)

  const [{ data: profiles, error: pe }, { data: troops, error: te }] = await Promise.all([
    client.from('profiles').select('id, display_name, avatar').in('id', ids),
    client.from('troops').select('id, owner_id, created_at').eq('is_personal', true).in('owner_id', ids).order('created_at'),
  ])
  fail(pe)
  fail(te)
  const profileOf = new Map(
    ((profiles ?? []) as { id: string; display_name: string | null; avatar: unknown }[]).map((p) => [p.id, p]),
  )
  const troopOf = new Map<string, string>()
  for (const t of (troops ?? []) as { id: string; owner_id: string }[]) {
    if (!troopOf.has(t.owner_id)) troopOf.set(t.owner_id, t.id)
  }

  return {
    id: members[0].household_id,
    members: members
      .map((m) => ({
        userId: m.user_id,
        role: m.role,
        name: profileOf.get(m.user_id)?.display_name ?? null,
        avatar: normalizeAvatar(profileOf.get(m.user_id)?.avatar),
        troopId: troopOf.get(m.user_id) ?? null,
        joinedAt: m.joined_at,
      }))
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
  }
}

export async function fetchTree(client: SupabaseClient, troopId: string): Promise<Monkey[]> {
  const { data, error } = await client.from('monkeys').select(COLUMNS).eq('troop_id', troopId).is('fed_at', null)
  fail(error)
  return ((data ?? []) as MonkeyRow[]).map(toMonkey)
}

export async function fetchMyName(client: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await client.from('profiles').select('display_name').eq('id', userId).maybeSingle()
  fail(error)
  return (data as { display_name: string | null } | null)?.display_name ?? null
}

export async function saveMyName(client: SupabaseClient, userId: string, name: string): Promise<void> {
  const { error } = await client.from('profiles').update({ display_name: name }).eq('id', userId)
  fail(error)
}

export async function createInvite(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('create_household_invite')
  fail(error)
  return data as string
}

export async function previewInvite(client: SupabaseClient, token: string): Promise<InvitePreview | null> {
  const { data, error } = await client.rpc('household_invite_preview', { tok: token })
  fail(error)
  const row = ((data ?? []) as { inviter_name: string | null; inviter_avatar: unknown; member_count: number; usable: boolean }[])[0]
  if (!row) return null
  return {
    inviterName: row.inviter_name,
    inviterAvatar: normalizeAvatar(row.inviter_avatar),
    memberCount: row.member_count,
    usable: row.usable,
  }
}

export async function acceptInvite(client: SupabaseClient, token: string): Promise<void> {
  const { error } = await client.rpc('accept_household_invite', { tok: token })
  fail(error)
}

export async function leaveHousehold(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('leave_household')
  fail(error)
}

export async function removeMember(client: SupabaseClient, userId: string): Promise<void> {
  const { error } = await client.rpc('remove_household_member', { member: userId })
  fail(error)
}

export async function handOver(client: SupabaseClient, monkeyId: string, toUser: string): Promise<void> {
  const { error } = await client.rpc('hand_over_monkey', { monkey: monkeyId, to_user: toUser })
  fail(error)
}
