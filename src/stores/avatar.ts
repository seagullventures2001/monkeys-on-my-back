import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { loadLocalAvatar, saveLocalAvatar, type Avatar } from '@/lib/avatar'
import { fetchAvatar, saveAvatar } from '@/data/profileRepo'
import { useTroopStore } from './troop'

/**
 * Your avatar. Always kept on the device so it shows instantly; when you're signed in
 * it's also saved on your profile, so it follows you to other devices and (later) shows
 * up for the people you share a household with.
 */
export const useAvatarStore = defineStore('avatar', () => {
  const troop = useTroopStore()
  const avatar = ref<Avatar | null>(loadLocalAvatar())
  // False until we know whether you already have an avatar (on this device or your profile),
  // so a signed-in person on a new phone isn't asked to make one again.
  const checked = ref(false)
  const error = ref<string | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  async function syncFromProfile(userId: string | null) {
    if (!userId || !supabase) return
    try {
      const remote = await fetchAvatar(supabase, userId)
      if (remote) {
        avatar.value = remote
        saveLocalAvatar(remote)
      } else if (avatar.value) {
        // First sign-in: the avatar made on this device becomes the profile's.
        await saveAvatar(supabase, userId, avatar.value)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load your avatar'
    }
  }

  watch(
    () => [troop.loading, troop.userId] as const,
    async ([loading, userId]) => {
      if (loading) return
      await syncFromProfile(userId)
      checked.value = true
    },
    { immediate: true },
  )

  /** Saves straight away on the device; the profile save waits a moment so quick taps send once. */
  function set(next: Avatar) {
    avatar.value = next
    saveLocalAvatar(next)
    const userId = troop.userId
    if (!userId || !supabase) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      try {
        error.value = null
        await saveAvatar(supabase!, userId, next)
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Could not save your avatar'
      }
    }, 600)
  }

  const needsSetup = computed(() => checked.value && !avatar.value)

  return { avatar, checked, needsSetup, error, set }
})
