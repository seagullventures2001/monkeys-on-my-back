import type { Monkey, NewMonkey } from '@/lib/monkey'
import type { EditableFields, MonkeyRepo } from './repo'

const KEY = 'momb.monkeys.v1'
const SEEDED_KEY = 'momb.seeded.v1'
export const LOCAL_TROOP = 'local'
export const DEMO_PREFIX = 'demo-'

const DAY = 24 * 60 * 60 * 1000

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString()
}

/** A few example monkeys so the tree is not empty the first time you open it. */
function demoMonkeys(): Monkey[] {
  const base = { troopId: LOCAL_TROOP, notes: null, fedAt: null }
  return [
    { ...base, id: `${DEMO_PREFIX}course`, title: 'Finish the online course', effort: 'ongoing', createdAt: daysAgo(240) },
    { ...base, id: `${DEMO_PREFIX}gurney`, title: 'Gurney the house', effort: 'full', createdAt: daysAgo(150) },
    { ...base, id: `${DEMO_PREFIX}tree`, title: 'Trim the front tree', effort: 'half', createdAt: daysAgo(90) },
    { ...base, id: `${DEMO_PREFIX}bbq`, title: 'Clean the BBQ', effort: 'hour', createdAt: daysAgo(42) },
    { ...base, id: `${DEMO_PREFIX}door`, title: 'Repaint the back door', effort: 'half', createdAt: daysAgo(21) },
    { ...base, id: `${DEMO_PREFIX}gate`, title: 'Fix the gate latch', effort: 'quick', createdAt: daysAgo(7) },
  ]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Used only if localStorage is unavailable.
let memory: Monkey[] = []

// localStorage can throw (private mode, storage full), so every access is guarded.
function read(): Monkey[] {
  try {
    if (!localStorage.getItem(SEEDED_KEY)) {
      localStorage.setItem(SEEDED_KEY, '1')
      const seeded = demoMonkeys()
      localStorage.setItem(KEY, JSON.stringify(seeded))
      return seeded
    }
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Monkey[]) : []
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
