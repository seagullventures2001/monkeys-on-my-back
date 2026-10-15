<script setup lang="ts">
import type { Nudge } from '@/lib/nudge'

defineProps<{ nudge: Nudge }>()
const emit = defineEmits<{ open: [id: string] }>()
</script>

<template>
  <button type="button" class="nudge" @click="emit('open', nudge.monkey.id)">
    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" class="icon">
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--banana)" stroke-width="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="var(--banana)" stroke-width="2" stroke-linecap="round" />
    </svg>
    <span><strong>{{ nudge.headline }}</strong> {{ nudge.body }}</span>
  </button>
</template>

<style scoped>
.nudge {
  width: 100%;
  text-align: left;
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--leaf-900);
  color: var(--white);
  border: 0;
  border-radius: 18px;
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.35;
  cursor: pointer;
}

.icon {
  flex: none;
}

strong {
  color: var(--banana);
}
</style>
