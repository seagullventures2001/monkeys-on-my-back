<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { EFFORTS, type Effort, type NewMonkey } from '@/lib/monkey'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; add: [input: NewMonkey] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)

const title = ref('')
const effort = ref<Effort>('hour')
const since = ref(0)
const notes = ref('')

// Lets people be honest about a job that has been hanging around for a while,
// so the monkey starts at the right size.
const SINCE_OPTIONS = [
  { days: 0, label: 'Just now' },
  { days: 21, label: 'A few weeks' },
  { days: 60, label: 'A couple of months' },
  { days: 180, label: 'Ages' },
]

watch(
  () => props.open,
  async (open) => {
    if (!dialog.value) return
    if (open && !dialog.value.open) {
      title.value = ''
      effort.value = 'hour'
      since.value = 0
      notes.value = ''
      dialog.value.showModal()
      await nextTick()
      titleInput.value?.focus()
    } else if (!open && dialog.value.open) {
      dialog.value.close()
    }
  },
)

function submit() {
  if (!title.value.trim()) return
  emit('add', {
    title: title.value.trim(),
    effort: effort.value,
    notes: notes.value.trim() || null,
    createdAt: since.value ? new Date(Date.now() - since.value * 86400000).toISOString() : undefined,
  })
}
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="add-title" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <h2 id="add-title">New monkey</h2>

      <div class="field">
        <label for="monkey-title">What is the job?</label>
        <input
          id="monkey-title"
          ref="titleInput"
          v-model="title"
          class="input"
          maxlength="120"
          placeholder="e.g. Clean the BBQ"
          required
        />
      </div>

      <fieldset class="field pills">
        <legend>How big is it?</legend>
        <div class="pill-row">
          <label v-for="e in EFFORTS" :key="e.value" class="pill" :class="{ on: effort === e.value }">
            <input v-model="effort" type="radio" name="effort" :value="e.value" class="sr-only" />
            {{ e.short }}
          </label>
        </div>
      </fieldset>

      <fieldset class="field pills">
        <legend>How long has it been on your back?</legend>
        <div class="pill-row">
          <label v-for="s in SINCE_OPTIONS" :key="s.days" class="pill" :class="{ on: since === s.days }">
            <input v-model="since" type="radio" name="since" :value="s.days" class="sr-only" />
            {{ s.label }}
          </label>
        </div>
      </fieldset>

      <div class="field">
        <label for="monkey-notes">Notes <span class="muted">(optional)</span></label>
        <textarea
          id="monkey-notes"
          v-model="notes"
          class="input"
          rows="2"
          maxlength="2000"
          placeholder="Paint colour, what to buy, who to call…"
        />
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="!title.trim()">Hang it on the tree</button>
        <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.dialog {
  border: 0;
  border-radius: var(--radius-lg);
  padding: 0;
  width: min(480px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  background: var(--white);
  color: var(--leaf-900);
}

.dialog::backdrop {
  background: rgba(30, 58, 43, 0.45);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px 20px 20px;
}

h2 {
  font-size: 26px;
}

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

legend {
  margin-bottom: 8px;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  border: 2px solid var(--leaf-300);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.pill.on {
  background: var(--leaf-900);
  border-color: var(--leaf-900);
  color: var(--white);
}

.pill:has(input:focus-visible) {
  outline: 3px solid var(--banana-deep);
  outline-offset: 2px;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions .btn-primary {
  flex: 1;
}
</style>
