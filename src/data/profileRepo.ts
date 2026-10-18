import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeAvatar, type Avatar } from '@/lib/avatar'

/**
 * Avatars live on each person's profile. Row-level security lets you read your own
 * and those of people you share a troop with; only you can change yours.
 */
export async function fetchAvatar(client: SupabaseClient, userId: string): Promise<Avatar | null> {
  const { data, error } = await client.from('profiles').select('avatar').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return normalizeAvatar((data as { avatar: unknown } | null)?.avatar)
}

/** Everyone's avatars for a set of people (for a shared household). Missing ones are left out. */
export async function fetchAvatars(client: SupabaseClient, userIds: string[]): Promise<Record<string, Avatar>> {
  if (userIds.length === 0) return {}
  const { data, error } = await client.from('profiles').select('id, avatar').in('id', userIds)
  if (error) throw new Error(error.message)
  const out: Record<string, Avatar> = {}
  for (const row of (data ?? []) as { id: string; avatar: unknown }[]) {
    const a = normalizeAvatar(row.avatar)
    if (a) out[row.id] = a
  }
  return out
}

export async function saveAvatar(client: SupabaseClient, userId: string, avatar: Avatar): Promise<void> {
  const { error } = await client.from('profiles').upsert({ id: userId, avatar })
  if (error) throw new Error(error.message)
}
