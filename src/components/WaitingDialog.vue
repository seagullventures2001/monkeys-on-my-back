<script setup lang="ts">
import { ref, watch } from 'vue'
import MonkeyFace from './MonkeyFace.vue'
import { effortShort, formatAge, moodFor, type Monkey } from '@/lib/monkey'
import { dueLabel } from '@/lib/due'

const props = defineProps<{ open: boolean; monkeys: Monkey[] }>()
const emit = defineEmits<{ close: []; pick: [id: string] }>()

const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!dialog.value) return
    if (open && !dialog.value.open) dialog.value.showModal()
    else if (!open && dialog.value.open) dialog.value.close()
  },
)
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="waiting-title" @close="emit('close')">
    <div class="inner">
      <div class="head">
        <h2 id="waiting-title">Waiting in the bushes</h2>
        <button type="button" class="close" aria-label="Close" @click="emit('close')">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <p class="muted lead">
        The tree only fits 8. These newer monkeys climb up as soon as a spot frees, or you can deal with one now.
      </p>
      <ul class="list">
        <li v-for="m in monkeys" :key="m.id">
          <button type="button" class="row" @click="emit('pick', m.id)">
            <span class="face"><MonkeyFace :mood="moodFor(m.createdAt)" /></span>
            <span class="text">
              <span class="title">{{ m.title }}</span>
              <span class="meta muted">
                <template v-if="m.dueOn">{{ dueLabel(m.dueOn) }} · </template>{{ formatAge(m.createdAt) }} ·
                {{ effortShort(m.effort) }}
              </span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" class="chev">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  border: 0;
  border-radius: var(--radius-lg);
  padding: 0;
  width: min(480px, calc(100vw - 24px));
  max-height: calc(100dvh - 48px);
  background: var(--leaf-50);
  color: var(--leaf-900);
}

.dialog::backdrop {
  background: rgba(30, 58, 43, 0.45);
}

.inner {
  padding: 20px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

h2 {
  font-size: 24px;
}

.close {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lead {
  margin: 6px 0 16px;
  font-size: 14px;
  line-height: 1.4;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  border: 0;
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  cursor: pointer;
  min-height: 60px;
}

.face {
  width: 42px;
  height: 42px;
  flex: none;
}

.text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 800;
  overflow-wrap: anywhere;
}

.meta {
  font-size: 13px;
  font-weight: 600;
}

.chev {
  flex: none;
  color: var(--ink-muted);
}
</style>
