<script setup lang="ts">
import { onMounted } from 'vue'
import { useTroopStore } from '@/stores/troop'

const store = useTroopStore()
onMounted(() => store.init())

const tabs = [
  { to: '/', label: 'Tree', icon: 'M12 3c-4 0-7 3-7 6.5 0 2.5 1.6 4.6 4 5.6V21h6v-5.9c2.4-1 4-3.1 4-5.6C19 6 16 3 12 3z' },
  { to: '/fed', label: 'Fed', icon: 'M4 9c1 7 9 11 16 4' },
  { to: '/settings', label: 'Settings', icon: 'M4 7h16M4 12h16M4 17h16' },
]
</script>

<template>
  <RouterView />
  <nav class="tabs" aria-label="Main">
    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab" exact-active-class="active">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path :d="t.icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: 520px;
  display: flex;
  justify-content: space-around;
  background: var(--white);
  border-top: 1px solid var(--leaf-200);
  padding: 6px 8px calc(6px + var(--safe-bottom));
  z-index: 10;
}

.tab {
  flex: 1;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 800;
  color: var(--ink-muted);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.tab.active {
  color: var(--leaf-700);
  background: var(--leaf-100);
}
</style>
