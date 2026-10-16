import type { Monkey, NewMonkey } from '@/lib/monkey'

export type EditableFields = Partial<Pick<Monkey, 'title' | 'notes' | 'effort' | 'dueOn'>>

/**
 * Everything the app needs from storage. There are two implementations:
 * - localRepo: saves in the browser / on the device. Works with no setup.
 * - supabaseRepo: saves to your Supabase project, shared across devices.
 */
export interface MonkeyRepo {
  readonly kind: 'local' | 'supabase'
  list(): Promise<Monkey[]>
  add(input: NewMonkey): Promise<Monkey>
  update(id: string, patch: EditableFields): Promise<Monkey>
  feed(id: string): Promise<Monkey>
  unfeed(id: string): Promise<Monkey>
  remove(id: string): Promise<void>
}
