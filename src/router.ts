import { createRouter, createWebHistory } from 'vue-router'
import TreeView from '@/views/TreeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: TreeView },
    { path: '/fed', component: () => import('@/views/FedView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
