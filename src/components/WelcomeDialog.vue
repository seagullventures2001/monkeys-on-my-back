<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MonkeyFigure from './MonkeyFigure.vue'
import BananaIcon from './BananaIcon.vue'

// First-launch explainer: what a monkey is and how to add one.
const emit = defineEmits<{ add: []; close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
onMounted(() => dialog.value?.showModal())

function choose(action: 'add' | 'close') {
  dialog.value?.close()
  if (action === 'add') emit('add')
  else emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="welcome-title" @cancel.prevent="choose('close')">
    <div class="inner">
      <div class="art" aria-hidden="true">
        <span class="fig"><MonkeyFigure :mood="3" pose="rest" /></span>
        <span class="arrow">
          <BananaIcon :size="34" />
          <svg width="48" height="16" viewBox="0 0 48 16"><path d="M2 8 H40 M33 2 L42 8 L33 14" fill="none" stroke="var(--leaf-700)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span class="fig"><MonkeyFigure :mood="0" /></span>
      </div>

      <h2 id="welcome-title">Got monkeys on your back?</h2>

      <ol class="steps">
        <li>
          <strong>A monkey is a job you keep putting off.</strong>
          <span>Clean the BBQ, gurney the house, finish that course. Not urgent, but it nags at you.</span>
        </li>
        <li>
          <strong>Hang it on your tree with the + button.</strong>
          <span>The longer it waits, the bigger and sadder the monkey gets.</span>
        </li>
        <li>
          <strong>Done it? Feed it a banana.</strong>
          <span>It jumps off your back and joins your troop.</span>
        </li>
      </ol>

      <div class="actions">
        <button type="button" class="btn btn-primary" @click="choose('add')">Add my first monkey</button>
        <button type="button" class="btn-link" @click="choose('close')">Have a look around first</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  border: 0;
  border-radius: var(--radius-lg);
  padding: 0;
  width: min(440px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  background: var(--white);
  color: var(--leaf-900);
}

.dialog::backdrop {
  background: rgba(30, 58, 43, 0.5);
}

.inner {
  padding: 24px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.art {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 0 4px;
  background: var(--leaf-100);
  border-radius: var(--radius-md);
}

.fig {
  width: 64px;
  aspect-ratio: 100 / 130;
}

.arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

h2 {
  font-size: 26px;
  font-weight: 800;
  text-align: center;
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.steps li {
  counter-increment: step;
  position: relative;
  padding-left: 40px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  line-height: 1.4;
}

.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--banana);
  color: var(--leaf-900);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.steps strong {
  font-size: 15px;
}

.steps span {
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  margin-top: 4px;
}

.actions .btn-link {
  align-self: center;
}
</style>
