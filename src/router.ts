import { createRouter, createWebHistory } from 'vue-router'
import TreeView from '@/views/TreeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: TreeView },
    { path: '/troop', component: () => import('@/views/TroopView.vue') },
    { path: '/household', component: () => import('@/views/HouseholdView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/avatar', component: () => import('@/views/AvatarView.vue') },
    // Household invite links
    { path: '/join/:token', component: () => import('@/views/JoinView.vue'), props: true },
    // The old "Fed" screen is now the list inside Troop.
    { path: '/fed', redirect: { path: '/troop', query: { view: 'list' } } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
