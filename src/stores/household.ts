import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Monkey } from '@/lib/monkey'
import {
  acceptInvite,
  createInvite,
  fetchHousehold,
  fetchMyName,
  fetchTree,
  handOver as handOverRpc,
  leaveHousehold,
  removeMember,
  saveMyName,
  type Household,
  type Member,
} from '@/data/householdRepo'
import { useTroopStore } from './troop'

/** Where an invite link waits while you sign in, so you land back on it afterwards. */
export const PENDING_INVITE_KEY = 'momb.pendingInvite'

export const useHouseholdStore = defineStore('household', () => {
  const troop = useTroopStore()
  const household = ref<Household | null>(null)
  const myName = ref<string | null>(null)
  // Everyone else's trees (monkeys still on their backs), by person.
  const trees = ref<Record<string, Monkey[]>>({})
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const me = computed(() => household.value?.members.find((m) => m.userId === troop.userId) ?? null)
  const others = computed(() => household.value?.members.filter((m) => m.userId !== troop.userId) ?? [])
  const isOwner = computed(() => me.value?.role === 'owner')

  function nameOf(userId: string | null | undefined): string {
    if (!userId) return 'Someone'
    const m = household.value?.members.find((x) => x.userId === userId)
    return m?.name?.trim() || 'Someone in your household'
  }

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Something went wrong'
      return undefined
    }
  }

  /** Runs an action that returns nothing; true if it worked. */
  async function act(fn: () => Promise<unknown>): Promise<boolean> {
    return (await run(async () => (await fn(), true))) === true
  }

  async function load() {
    if (!supabase || !troop.userId) {
      household.value = null
      trees.value = {}
      loaded.value = true
      return
    }
    loading.value = true
    await run(async () => {
      const [h, name] = await Promise.all([fetchHousehold(supabase!), fetchMyName(supabase!, troop.userId!)])
      household.value = h
      myName.value = name
      const next: Record<string, Monkey[]> = {}
      for (const m of h?.members ?? []) {
        if (m.userId !== troop.userId && m.troopId) next[m.userId] = await fetchTree(supabase!, m.troopId)
      }
      trees.value = next
    })
    loading.value = false
    loaded.value = true
  }

  watch(
    () => troop.userId,
    () => void load(),
    { immediate: true },
  )

  async function setName(name: string) {
    if (!supabase || !troop.userId) return
    const clean = name.trim().slice(0, 40)
    if (!clean) return
    if (await act(() => saveMyName(supabase!, troop.userId!, clean))) {
      myName.value = clean
      if (household.value) await load()
    }
  }

  /** A fresh single-use invite link (makes your household if you don't have one yet). */
  async function invite(): Promise<string | null> {
    if (!supabase) return null
    const token = await run(() => createInvite(supabase!))
    if (!token) return null
    await load()
    return `${window.location.origin}/join/${token}`
  }

  async function join(token: string): Promise<boolean> {
    if (!supabase) return false
    if (!(await act(() => acceptInvite(supabase!, token)))) return false
    await load()
    return true
  }

  async function leave() {
    if (!supabase) return
    await act(() => leaveHousehold(supabase!))
    await load()
  }

  async function remove(member: Member) {
    if (!supabase) return
    await act(() => removeMember(supabase!, member.userId))
    await load()
  }

  /** Moves one of your monkeys onto someone else's tree. */
  async function handOver(monkeyId: string, toUser: string): Promise<boolean> {
    if (!supabase) return false
    if (!(await act(() => handOverRpc(supabase!, monkeyId, toUser)))) return false
    await Promise.all([troop.refresh(), load()])
    return true
  }

  return {
    household,
    myName,
    trees,
    loading,
    loaded,
    error,
    me,
    others,
    isOwner,
    nameOf,
    load,
    setName,
    invite,
    join,
    leave,
    remove,
    handOver,
  }
})
