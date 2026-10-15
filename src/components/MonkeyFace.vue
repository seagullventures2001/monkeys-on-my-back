<script setup lang="ts">
import { computed } from 'vue'
import type { Mood } from '@/lib/monkey'

const props = withDefaults(defineProps<{ mood?: Mood; label?: string }>(), { mood: 0, label: '' })

// Content smile, flat restless mouth, or a grumpy frown.
const mouth = computed(
  () => ['M40 69 Q50 78 60 69', 'M41 71 L59 71', 'M40 74 Q50 66 60 74'][props.mood],
)
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <circle cx="16" cy="48" r="14" fill="var(--fur)" />
    <circle cx="84" cy="48" r="14" fill="var(--fur)" />
    <circle cx="16" cy="48" r="7" fill="var(--face)" />
    <circle cx="84" cy="48" r="7" fill="var(--face)" />
    <circle cx="50" cy="52" r="36" fill="var(--fur)" />
    <circle cx="39" cy="47" r="13" fill="var(--face)" />
    <circle cx="61" cy="47" r="13" fill="var(--face)" />
    <ellipse cx="50" cy="66" rx="23" ry="17" fill="var(--face)" />
    <circle cx="40" cy="48" r="4.5" fill="#2a1a10" />
    <circle cx="60" cy="48" r="4.5" fill="#2a1a10" />
    <path
      v-if="mood === 2"
      d="M31 36 L45 41 M69 36 L55 41"
      stroke="#2a1a10"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path v-else-if="mood === 1" d="M33 38 L45 39 M67 38 L55 39" stroke="#2a1a10" stroke-width="3" stroke-linecap="round" />
    <ellipse cx="50" cy="60" rx="4" ry="2.5" fill="#6b4a2b" />
    <path :d="mouth" fill="none" stroke="#2a1a10" stroke-width="3.5" stroke-linecap="round" />
  </svg>
</template>
