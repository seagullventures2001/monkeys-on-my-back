<script setup lang="ts">
withDefaults(defineProps<{ size?: number; color?: string }>(), { size: 22, color: 'var(--banana-deep)' })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9c1 7 9 11 16 4" fill="none" :stroke="color" stroke-width="4" stroke-linecap="round" />
    <path d="M19.5 12.5l1.5-2" stroke="#6b4a2b" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>
