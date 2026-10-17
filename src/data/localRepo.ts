import type { Monkey, NewMonkey } from '@/lib/monkey'
import type { EditableFields, MonkeyRepo } from './repo'

const KEY = 'momb.monkeys.v1'
export const LOCAL_TROOP = 'local'
// Early versions added example monkeys with ids starting "demo-"; Settings can still clear them.
export const DEMO_PREFIX = 'demo-'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Used only if localStorage is unavailable.
let memory: Monkey[] = []

// localStorage can throw (private mode, storage full), so every access is guarded.
function read(): Monkey[] {
  try {
    const raw = localStorage.getItem(KEY)
    // Monkeys saved before due dates existed have no dueOn field.
    return raw ? (JSON.parse(raw) as Monkey[]).map((m) => ({ ...m, dueOn: m.dueOn ?? null })) : []
  } catch {
    return memory
  }
}

function write(list: Monkey[]): void {
  memory = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Fall back to in-memory only; the app keeps working for this session.
  }
}

function mutate(id: string, fn: (m: Monkey) => Monkey): Monkey {
  const list = read()
  const i = list.findIndex((m) => m.id === id)
  if (i < 0) throw new Error('Monkey not found')
  list[i] = fn(list[i])
  write(list)
  return list[i]
}

export const localRepo: MonkeyRepo & { clearDemo(): void; hasDemo(): boolean } = {
  kind: 'local',

  async list() {
    return read()
  },

  async add(input: NewMonkey) {
    const monkey: Monkey = {
      id: newId(),
      troopId: LOCAL_TROOP,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      effort: input.effort,
      createdAt: input.createdAt ?? new Date().toISOString(),
      fedAt: null,
      dueOn: input.dueOn ?? null,
    }
    write([...read(), monkey])
    return monkey
  },

  async update(id: string, patch: EditableFields) {
    return mutate(id, (m) => ({ ...m, ...patch }))
  },

  async feed(id: string) {
    return mutate(id, (m) => ({ ...m, fedAt: new Date().toISOString() }))
  },

  async unfeed(id: string) {
    return mutate(id, (m) => ({ ...m, fedAt: null }))
  },

  async remove(id: string) {
    write(read().filter((m) => m.id !== id))
  },

  clearDemo() {
    write(read().filter((m) => !m.id.startsWith(DEMO_PREFIX)))
  },

  hasDemo() {
    return read().some((m) => m.id.startsWith(DEMO_PREFIX))
  },
}
