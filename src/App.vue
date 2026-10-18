<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTroopStore } from '@/stores/troop'
import { PENDING_INVITE_KEY } from '@/stores/household'

const store = useTroopStore()
onMounted(() => store.init())

// Opened an invite link, then signed in from the email: take them back to the invite.
const router = useRouter()
const route = useRoute()
watch(
  () => store.userId,
  (id) => {
    if (!id) return
    let token: string | null = null
    try {
      token = localStorage.getItem(PENDING_INVITE_KEY)
    } catch {
      token = null
    }
    if (token && !route.path.startsWith('/join/')) void router.push(`/join/${token}`)
  },
)

// Tree is the home screen, so it sits in the middle and stands out.
const tabs = [
  { to: '/troop', label: 'Troop', icon: 'troop' },
  { to: '/', label: 'Tree', icon: 'tree' },
  { to: '/household', label: 'Household', icon: 'house', pro: true },
] as const
</script>

<template>
  <RouterView />
  <nav class="tabs" aria-label="Main">
    <RouterLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="tab"
      :class="{ home: t.icon === 'tree' }"
      :exact-active-class="t.to === '/' ? 'active' : ''"
      :active-class="t.to === '/' ? '' : 'active'"
    >
      <span class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <template v-if="t.icon === 'tree'">
            <path d="M12 3c-4 0-7 3-7 6.5 0 2.5 1.6 4.6 4 5.6V21h6v-5.9c2.4-1 4-3.1 4-5.6C19 6 16 3 12 3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
          </template>
          <template v-else-if="t.icon === 'troop'">
            <circle cx="8" cy="10" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2" />
            <circle cx="16.5" cy="10" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2" />
            <path d="M2.5 20c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8M11 16.2c1-.7 2.2-1 3.5-1 2.5 0 4.7 1.6 5.5 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </template>
          <template v-else>
            <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
          </template>
        </svg>
        <span v-if="'pro' in t" class="pro">Pro</span>
      </span>
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
  align-items: flex-end;
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
}

.icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 30px;
  border-radius: 999px;
}

.tab.active .icon {
  background: var(--leaf-100);
}

/* The Tree tab: a raised round button in the middle. */
.tab.home .icon {
  width: 56px;
  height: 56px;
  margin-top: -22px;
  border-radius: 50%;
  background: var(--leaf-700);
  color: var(--white);
  box-shadow: 0 4px 12px rgba(30, 58, 43, 0.3);
  border: 4px solid var(--white);
}

.tab.home.active .icon {
  background: var(--leaf-900);
}

.pro {
  position: absolute;
  top: -6px;
  right: -8px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--banana);
  color: var(--leaf-900);
  font-size: 9px;
  font-weight: 800;
  line-height: 15px;
}
</style>
