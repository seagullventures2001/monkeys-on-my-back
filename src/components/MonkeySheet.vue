<script setup lang="ts">
import { ref, watch } from 'vue'
import BananaIcon from './BananaIcon.vue'
import { EFFORTS, effortShort, formatAge, type Effort, type Monkey } from '@/lib/monkey'

const props = defineProps<{ monkey: Monkey }>()
const emit = defineEmits<{
  feed: [id: string]
  save: [id: string, patch: { title: string; effort: Effort; notes: string | null }]
  remove: [id: string]
  close: []
}>()

const editing = ref(false)
const title = ref('')
const effort = ref<Effort>('hour')
const notes = ref('')

function startEdit() {
  title.value = props.monkey.title
  effort.value = props.monkey.effort
  notes.value = props.monkey.notes ?? ''
  editing.value = true
}

watch(
  () => props.monkey.id,
  () => (editing.value = false),
)

function save() {
  if (!title.value.trim()) return
  emit('save', props.monkey.id, { title: title.value.trim(), effort: effort.value, notes: notes.value.trim() || null })
  editing.value = false
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
        <p class="meta">On your back for {{ formatAge(monkey.createdAt) }} · {{ effortShort(monkey.effort) }}</p>
        <p v-if="monkey.notes" class="notes">{{ monkey.notes }}</p>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-banana feed" @click="emit('feed', monkey.id)">
          <BananaIcon :size="22" color="var(--leaf-900)" />
          Feed a banana
        </button>
        <button type="button" class="btn btn-ghost" @click="startEdit">Edit</button>
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

.danger {
  color: var(--danger);
  align-self: flex-start;
}
</style>
