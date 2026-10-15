import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { byAge, isOnBack, type Monkey, type NewMonkey } from '@/lib/monkey'
import { pickNudge } from '@/lib/nudge'
import { supabase } from '@/lib/supabase'
import { localRepo } from '@/data/localRepo'
import { createSupabaseRepo, fetchPersonalTroopId } from '@/data/supabaseRepo'
import type { EditableFields, MonkeyRepo } from '@/data/repo'
import { scheduleWeekendNudge } from '@/lib/notifications'

export const useTroopStore = defineStore('troop', () => {
  const monkeys = ref<Monkey[]>([])
  const repo = shallowRef<MonkeyRepo>(localRepo)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  /** Set briefly after feeding so the UI can celebrate and offer undo. */
  const lastFed = ref<Monkey | null>(null)

  const onBack = computed(() => monkeys.value.filter(isOnBack).sort(byAge))
  const fed = computed(() =>
    monkeys.value
      .filter((m) => !isOnBack(m))
      .sort((a, b) => new Date(b.fedAt!).getTime() - new Date(a.fedAt!).getTime()),
  )
  const nudge = computed(() => pickNudge(monkeys.value))
  const mode = computed(() => repo.value.kind)
  const email = computed(() => session.value?.user.email ?? null)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Something went wrong'
      return undefined
    }
  }

  async function refresh() {
    await run(async () => {
      monkeys.value = await repo.value.list()
    })
    void scheduleWeekendNudge(monkeys.value)
  }

  async function useSession(s: Session | null) {
    session.value = s
    if (s && supabase) {
      const troopId = await run(() => fetchPersonalTroopId(supabase!, s.user.id))
      repo.value = troopId ? createSupabaseRepo(supabase, troopId) : localRepo
    } else {
      repo.value = localRepo
    }
    await refresh()
  }

  async function init() {
    loading.value = true
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      await useSession(data.session)
      supabase.auth.onAuthStateChange((_event, s) => {
        if (s?.user.id !== session.value?.user.id) void useSession(s)
      })
    } else {
      await refresh()
    }
    loading.value = false
  }

  async function add(input: NewMonkey) {
    const m = await run(() => repo.value.add(input))
    if (m) monkeys.value = [...monkeys.value, m]
    void scheduleWeekendNudge(monkeys.value)
    return m
  }

  function replace(m: Monkey) {
    monkeys.value = monkeys.value.map((x) => (x.id === m.id ? m : x))
  }

  async function feed(id: string) {
    const m = await run(() => repo.value.feed(id))
    if (m) {
      replace(m)
      lastFed.value = m
    }
    void scheduleWeekendNudge(monkeys.value)
  }

  async function unfeed(id: string) {
    const m = await run(() => repo.value.unfeed(id))
    if (m) replace(m)
    if (lastFed.value?.id === id) lastFed.value = null
  }

  async function update(id: string, patch: EditableFields) {
    const m = await run(() => repo.value.update(id, patch))
    if (m) replace(m)
  }

  async function remove(id: string) {
    await run(async () => {
      await repo.value.remove(id)
      monkeys.value = monkeys.value.filter((m) => m.id !== id)
    })
  }

  async function signIn(address: string) {
    if (!supabase) return false
    const ok = await run(async () => {
      const { error: e } = await supabase!.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: window.location.origin },
      })
      if (e) throw new Error(e.message)
      return true
    })
    return ok === true
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    await useSession(null)
  }

  /** Copies monkeys saved on this device into the signed-in account (skips the demo ones). */
  async function copyLocalToAccount() {
    if (repo.value.kind !== 'supabase') return 0
    const local = (await localRepo.list()).filter((m) => !m.id.startsWith('demo-'))
    let copied = 0
    for (const m of local) {
      const created = await run(() =>
        repo.value.add({ title: m.title, notes: m.notes, effort: m.effort, createdAt: m.createdAt }),
      )
      if (created && m.fedAt) await run(() => repo.value.feed(created.id))
      if (created) copied++
    }
    await refresh()
    return copied
  }

  return {
    monkeys,
    onBack,
    fed,
    nudge,
    mode,
    email,
    loading,
    error,
    lastFed,
    init,
    refresh,
    add,
    feed,
    unfeed,
    update,
    remove,
    signIn,
    signOut,
    copyLocalToAccount,
  }
})
