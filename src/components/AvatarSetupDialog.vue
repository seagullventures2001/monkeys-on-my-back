<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AvatarFigure from './AvatarFigure.vue'
import { defaultAvatar, type Body } from '@/lib/avatar'

// First open: pick who's carrying the monkeys. Everything else can be changed later.
const emit = defineEmits<{ pick: [body: Body] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const title = ref<HTMLElement | null>(null)
onMounted(() => {
  dialog.value?.showModal()
  title.value?.focus()
})

const choices = [
  { body: 'male' as const, label: 'Male', avatar: defaultAvatar('male') },
  { body: 'female' as const, label: 'Female', avatar: defaultAvatar('female') },
]

function pick(body: Body) {
  dialog.value?.close()
  emit('pick', body)
}
</script>

<template>
  <!-- A choice is needed, so Escape doesn't close it. -->
  <dialog ref="dialog" class="dialog" aria-labelledby="setup-title" @cancel.prevent>
    <div class="inner">
      <h2 id="setup-title" ref="title" tabindex="-1">Who's carrying the monkeys?</h2>
      <p class="muted">Pick one to start. You can change your hair, clothes and more any time.</p>
      <div class="choices">
        <button v-for="c in choices" :key="c.body" type="button" class="choice" @click="pick(c.body)">
          <span class="fig"><AvatarFigure :avatar="c.avatar" /></span>
          <span class="label">{{ c.label }}</span>
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  border: 0;
  border-radius: var(--radius-lg);
  padding: 0;
  width: min(420px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  background: var(--white);
  color: var(--leaf-900);
}

.dialog::backdrop {
  background: rgba(30, 58, 43, 0.55);
}

.inner {
  padding: 26px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

h2 {
  outline: none;
  font-size: 26px;
  font-weight: 800;
}

.inner > p {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.4;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 12px;
  border: 3px solid transparent;
  border-radius: var(--radius-md);
  background: var(--leaf-100);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.choice:hover {
  border-color: var(--banana);
  transform: translateY(-2px);
}

.fig {
  width: 74px;
  aspect-ratio: 120 / 300;
}

.label {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
}
</style>
