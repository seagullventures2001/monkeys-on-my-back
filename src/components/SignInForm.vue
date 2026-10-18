<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useTroopStore } from '@/stores/troop'

// Sign in with your email. We email a short code (and a link). Typing the code works
// anywhere, including the home-screen app, where tapping the link would open a
// different browser that the app can't see.
withDefaults(defineProps<{ label?: string }>(), { label: 'Sign in to sync across devices' })
const emit = defineEmits<{ signedIn: [] }>()
const store = useTroopStore()

const email = ref('')
const code = ref('')
const step = ref<'email' | 'code'>('email')
const busy = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)

async function send() {
  const address = email.value.trim()
  if (!address) return
  busy.value = true
  const ok = await store.signIn(address)
  busy.value = false
  if (ok) {
    step.value = 'code'
    code.value = ''
    await nextTick()
    codeInput.value?.focus()
  }
}

async function verify() {
  const token = code.value.replace(/\D/g, '')
  if (token.length < 6) return
  busy.value = true
  const ok = await store.verifyCode(email.value.trim(), token)
  busy.value = false
  if (ok) emit('signedIn')
}

function startOver() {
  step.value = 'email'
  code.value = ''
}
</script>

<template>
  <form v-if="step === 'email'" class="signin" @submit.prevent="send">
    <div class="field">
      <label for="signin-email">{{ label }}</label>
      <input id="signin-email" v-model="email" type="email" class="input" autocomplete="email" placeholder="you@example.com" required />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="busy">{{ busy ? 'Sending…' : 'Email me a sign-in code' }}</button>
  </form>

  <form v-else class="signin" @submit.prevent="verify">
    <p class="sent" role="status">
      We've emailed a code to <strong>{{ email }}</strong>. Type it here.
    </p>
    <div class="field">
      <label for="signin-code">Code from the email</label>
      <input
        id="signin-code"
        ref="codeInput"
        v-model="code"
        class="input code"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9 ]*"
        maxlength="10"
        placeholder="123456"
        required
      />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="busy">{{ busy ? 'Checking…' : 'Sign in' }}</button>
    <p class="muted small">
      No email? Check your junk folder, or
      <button type="button" class="btn-link" @click="send">send a new code</button> ·
      <button type="button" class="btn-link" @click="startOver">use a different email</button>
    </p>
  </form>
</template>

<style scoped>
.signin {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sent {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--leaf-100);
  font-weight: 600;
  line-height: 1.4;
}

.code {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-align: center;
}

.small {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.small .btn-link {
  min-height: 0;
  padding: 0;
  font-size: 14px;
}
</style>
