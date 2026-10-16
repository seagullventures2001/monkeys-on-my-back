<script setup lang="ts">
import { computed } from 'vue'
import { nextSaturday, toDayString } from '@/lib/due'

// Optional due date: a switch that is off by default, and a date picker once it is on.
// v-model is a calendar day ("2026-10-24") or null for "no due date".
const model = defineModel<string | null>({ required: true })
const props = defineProps<{ id: string }>()

const on = computed({
  get: () => model.value !== null,
  set: (v: boolean) => (model.value = v ? nextSaturday() : null),
})
const today = toDayString(new Date())
</script>

<template>
  <div class="due">
    <label class="switch-row" :for="`${props.id}-toggle`">
      <span class="label-text">
        <strong>Needs doing by a date</strong>
        <span class="muted">Most monkeys don't need one</span>
      </span>
      <input :id="`${props.id}-toggle`" v-model="on" type="checkbox" role="switch" class="switch" />
    </label>
    <div v-if="on" class="field">
      <label :for="`${props.id}-date`" class="sr-only">Due date</label>
      <input :id="`${props.id}-date`" v-model="model" type="date" class="input" :min="today" required />
    </div>
  </div>
</template>

<style scoped>
.due {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  cursor: pointer;
}

.label-text {
  display: flex;
  flex-direction: column;
  font-size: 14px;
}

.label-text strong {
  font-weight: 800;
}

.label-text .muted {
  font-size: 13px;
  font-weight: 600;
}

/* A simple on/off switch built from a real checkbox, so it works with keyboards and screen readers. */
.switch {
  appearance: none;
  flex: none;
  width: 52px;
  height: 32px;
  border-radius: 999px;
  background: var(--leaf-300);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  margin: 0;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 1px 3px rgba(30, 58, 43, 0.3);
  transition: transform 0.2s ease;
}

.switch:checked {
  background: var(--leaf-700);
}

.switch:checked::after {
  transform: translateX(20px);
}
</style>
