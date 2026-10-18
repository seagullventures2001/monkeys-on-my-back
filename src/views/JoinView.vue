<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AvatarFigure from '@/components/AvatarFigure.vue'
import { supabase } from '@/lib/supabase'
import { previewInvite, type InvitePreview } from '@/data/householdRepo'
import { useTroopStore } from '@/stores/troop'
import { PENDING_INVITE_KEY, useHouseholdStore } from '@/stores/household'

// Opened from an invite link: /join/<token>. Shows who invited you; if you're not signed
// in yet you sign in here, and the link brings you back to this page afterwards.
const props = defineProps<{ token: string }>()
const router = useRouter()
const troop = useTroopStore()
const house = useHouseholdStore()

const preview = ref<InvitePreview | null>(null)
const checked = ref(false)
const email = ref('')
const linkSent = ref(false)
const joining = ref(false)

const signedIn = computed(() => troop.mode === 'supabase')
const inviter = computed(() => preview.value?.inviterName?.trim() || 'Someone')
const alreadyIn = computed(() => house.others.length > 0)

function remember(token: string | null) {
  try {
    if (token) localStorage.setItem(PENDING_INVITE_KEY, token)
    else localStorage.removeItem(PENDING_INVITE_KEY)
  } catch {
    // Not remembered; they can open the link again after signing in.
  }
}

onMounted(async () => {
  remember(props.token)
  if (supabase) {
    try {
      preview.value = await previewInvite(supabase, props.token)
    } catch {
      preview.value = null
    }
  }
  checked.value = true
})

// Once you're signed in the link doesn't need remembering any more.
watch(signedIn, (yes) => yes && preview.value?.usable === false && remember(null))

async function sendLink() {
  if (!email.value.trim()) return
  linkSent.value = await troop.signIn(email.value.trim())
}

async function join() {
  joining.value = true
  const ok = await house.join(props.token)
  joining.value = false
  if (ok) {
    remember(null)
    router.replace('/household')
  }
}

function notNow() {
  remember(null)
  router.replace('/')
}
</script>

<template>
  <main class="page join">
    <div class="card">
      <template v-if="!checked">
        <p class="muted">Checking your invite…</p>
      </template>

      <template v-else-if="!preview || !preview.usable">
        <h1>This invite has expired</h1>
        <p class="muted">Invite links work once and last 7 days. Ask for a new one.</p>
        <button type="button" class="btn btn-primary" @click="notNow">Go to my tree</button>
      </template>

      <template v-else>
        <span class="who" aria-hidden="true">
          <AvatarFigure v-if="preview.inviterAvatar" :avatar="preview.inviterAvatar" part="head" />
        </span>
        <h1>{{ inviter }} invited you to their household</h1>
        <p class="muted">
          You'll each keep your own tree, see each other's, and be able to hand a job over when it's the other
          person's.
        </p>

        <template v-if="!signedIn">
          <p><strong>Sign in first</strong>, then come back to this link (we'll remember it).</p>
          <form v-if="!linkSent" class="signin" @submit.prevent="sendLink">
            <label for="join-email" class="sr-only">Email</label>
            <input id="join-email" v-model="email" type="email" class="input" autocomplete="email" placeholder="you@example.com" required />
            <button type="submit" class="btn btn-primary">Email me a sign-in link</button>
          </form>
          <p v-else class="note" role="status">Check your email and open the sign-in link on this phone. You'll come straight back here.</p>
        </template>

        <template v-else>
          <p v-if="alreadyIn" class="note">You're already in a household. Leave it first (on the Household tab) to join this one.</p>
          <button v-else type="button" class="btn btn-primary" :disabled="joining" @click="join">
            {{ joining ? 'Joining…' : `Join ${inviter}'s household` }}
          </button>
        </template>

        <p v-if="house.error || troop.error" class="error" role="alert">{{ house.error || troop.error }}</p>
        <button type="button" class="btn-link" @click="notNow">Not now</button>
      </template>
    </div>
  </main>
</template>

<style scoped>
.join {
  min-height: 100dvh;
  display: flex;
  align-items: center;
}

.card {
  width: 100%;
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 24px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.card p {
  margin: 0;
  line-height: 1.45;
}

h1 {
  font-size: 26px;
  font-weight: 800;
}

.who {
  align-self: center;
  width: 84px;
  height: 92px;
  border-radius: 50%;
  background: var(--leaf-100);
  overflow: hidden;
}

.signin {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note {
  background: var(--leaf-100);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-weight: 600;
}

.btn-link {
  align-self: center;
}

.error {
  color: var(--danger);
  font-weight: 700;
}
</style>
