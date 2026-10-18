<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BananaIcon from './BananaIcon.vue'
import { EFFORTS, effortShort, formatAge, type Effort, type Monkey } from '@/lib/monkey'
import { daysUntil, dueLabel } from '@/lib/due'
import DueDateField from './DueDateField.vue'

// handTo: other people in your household (if any), so the job can be handed to them.
// fromName: who handed this monkey to you, if someone did.
const props = withDefaults(
  defineProps<{ monkey: Monkey; handTo?: { userId: string; name: string }[]; fromName?: string | null }>(),
  { handTo: () => [], fromName: null },
)
const emit = defineEmits<{
  feed: [id: string]
  handOver: [id: string, toUser: string, name: string]
  save: [id: string, patch: { title: string; effort: Effort; notes: string | null; dueOn: string | null }]
  remove: [id: string]
  close: []
}>()

const ageLine = computed(() => {
  const age = formatAge(props.monkey.createdAt)
  return age === 'today' ? 'Added today' : `On your back for ${age}`
})

const editing = ref(false)
const title = ref('')
const effort = ref<Effort>('hour')
const notes = ref('')
const dueOn = ref<string | null>(null)

const due = computed(() =>
  props.monkey.dueOn
    ? { label: dueLabel(props.monkey.dueOn), late: daysUntil(props.monkey.dueOn) < 0 }
    : null,
)

function startEdit() {
  title.value = props.monkey.title
  effort.value = props.monkey.effort
  notes.value = props.monkey.notes ?? ''
  dueOn.value = props.monkey.dueOn
  editing.value = true
}

watch(
  () => props.monkey.id,
  () => (editing.value = false),
)

function save() {
  if (!title.value.trim()) return
  emit('save', props.monkey.id, {
    title: title.value.trim(),
    effort: effort.value,
    notes: notes.value.trim() || null,
    dueOn: dueOn.value,
  })
  editing.value = false
}

function confirmHandOver(to: { userId: string; name: string }) {
  if (window.confirm(`Hand “${props.monkey.title}” to ${to.name}? It moves onto their tree.`)) {
    emit('handOver', props.monkey.id, to.userId, to.name)
  }
}

function confirmRemove() {
  if (window.confirm(`Remove “${props.monkey.title}” without feeding it? It will not count as done.`)) {
    emit('remove', props.monkey.id)
  }
}
</script>

<template>
  <section class="sheet" aria-live="polite">
    <template v-if="!editing">
      <div class="head">
        <h2>{{ monkey.title }}</h2>
        <p v-if="due" class="due-pill" :class="{ late: due.late }">{{ due.label }}</p>
        <p class="meta">{{ ageLine }} · {{ effortShort(monkey.effort) }}</p>
        <p v-if="fromName" class="from">Handed to you by {{ fromName }}</p>
        <p v-if="monkey.notes" class="notes">{{ monkey.notes }}</p>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-banana feed" @click="emit('feed', monkey.id)">
          <BananaIcon :size="22" color="var(--leaf-900)" />
          Feed a banana
        </button>
        <button type="button" class="btn btn-ghost" @click="startEdit">Edit</button>
      </div>
      <div v-if="handTo.length" class="hand">
        <span class="hand-label">Not your job?</span>
        <button v-for="p in handTo" :key="p.userId" type="button" class="btn btn-ghost hand-btn" @click="confirmHandOver(p)">
          Hand to {{ p.name }}
        </button>
      </div>
    </template>

    <form v-else class="edit" @submit.prevent="save">
      <div class="field">
        <label for="edit-title">What is the job?</label>
        <input id="edit-title" v-model="title" class="input" maxlength="120" required />
      </div>
      <div class="field">
        <label for="edit-effort">How big is it?</label>
        <select id="edit-effort" v-model="effort" class="input">
          <option v-for="e in EFFORTS" :key="e.value" :value="e.value">{{ e.label }}</option>
        </select>
      </div>
      <DueDateField id="edit-due" v-model="dueOn" />
      <div class="field">
        <label for="edit-notes">Notes</label>
        <textarea id="edit-notes" v-model="notes" class="input" rows="2" maxlength="2000" />
      </div>
      <div class="actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-ghost" @click="editing = false">Cancel</button>
      </div>
      <button type="button" class="btn-link danger" @click="confirmRemove">Remove this monkey</button>
    </form>
  </section>
</template>

<style scoped>
.sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h2 {
  font-size: 24px;
}

.meta {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-muted);
}

.due-pill {
  display: inline-block;
  margin: 8px 0 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--due);
  color: var(--white);
  font-size: 13px;
  font-weight: 800;
}

.due-pill.late {
  background: var(--danger);
}

.notes {
  margin: 8px 0 0;
  font-size: 14px;
  white-space: pre-line;
}

.actions {
  display: flex;
  gap: 10px;
}

.feed {
  flex: 1;
  min-height: 52px;
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit .actions .btn {
  flex: 1;
}

.from {
  display: inline-block;
  margin: 8px 0 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--banana);
  font-size: 13px;
  font-weight: 800;
}

.hand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--leaf-200);
}

.hand-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-muted);
}

.hand-btn {
  min-height: 40px;
}

.danger {
  color: var(--danger);
  align-self: flex-start;
}
</style>
