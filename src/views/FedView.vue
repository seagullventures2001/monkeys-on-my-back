<script setup lang="ts">
import { useTroopStore } from '@/stores/troop'
import BananaIcon from '@/components/BananaIcon.vue'
import MonkeyFace from '@/components/MonkeyFace.vue'

const store = useTroopStore()

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function hungFor(createdAt: string, fedAt: string): string {
  const days = Math.max(0, Math.round((new Date(fedAt).getTime() - new Date(createdAt).getTime()) / 86400000))
  if (days === 0) return 'same day'
  if (days < 14) return days === 1 ? '1 day' : `${days} days`
  if (days < 63) return `${Math.floor(days / 7)} weeks`
  return `${Math.floor(days / 30.44)} months`
}
</script>

<template>
  <main class="page">
    <h1>Bananas fed</h1>
    <p class="muted lead">
      {{
        store.fed.length === 0
          ? 'Nothing yet. Your first banana is waiting.'
          : store.fed.length === 1
            ? '1 monkey off your back so far.'
            : `${store.fed.length} monkeys off your back so far.`
      }}
    </p>

    <ul v-if="store.fed.length" class="list">
      <li v-for="m in store.fed" :key="m.id" class="row">
        <span class="face"><MonkeyFace :mood="0" /></span>
        <div class="text">
          <span class="title">{{ m.title }}</span>
          <span class="meta muted">
            Fed {{ dateFmt.format(new Date(m.fedAt!)) }} · hung around {{ hungFor(m.createdAt, m.fedAt!) }}
          </span>
        </div>
        <button type="button" class="btn-link" :aria-label="`Put ${m.title} back on the tree`" @click="store.unfeed(m.id)">
          Put back
        </button>
      </li>
    </ul>

    <div v-else class="empty">
      <BananaIcon :size="64" />
    </div>
  </main>
</template>

<style scoped>
h1 {
  font-size: 36px;
  font-weight: 800;
}

.lead {
  margin: 6px 0 20px;
  font-size: 15px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 10px 10px 10px 12px;
}

.face {
  width: 40px;
  height: 40px;
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

.empty {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
