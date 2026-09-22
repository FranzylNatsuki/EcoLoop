<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { RelatedEvent } from '../../types/event'
import RelatedEventItem from './RelatedEventItem.vue'

defineProps<{
  events?: RelatedEvent[]
}>()

const router = useRouter()

function navigateToEvent(id: string | number) {
  router.push(`/events/${id}`)
}
</script>

<template>
  <aside class="related-events-card">
    <h3 class="card-title">Related Events</h3>

    <div v-if="events && events.length > 0" class="related-list">
      <div
        v-for="rel in events"
        :key="rel.id"
        class="related-item-wrapper"
        @click="navigateToEvent(rel.id)"
      >
        <RelatedEventItem
          :title="rel.title"
          :category="rel.category"
          :image="rel.image"
          :funded-percentage="rel.fulfillment_percent ?? 0"
        />
      </div>
    </div>

    <p v-else class="empty-state">No related events found.</p>
  </aside>
</template>

<style scoped>
.related-events-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.card-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1a1d1a;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.related-item-wrapper {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.related-item-wrapper:hover {
  background-color: #f7f8f6;
}

.empty-state {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-top: 12px;
}
</style>
