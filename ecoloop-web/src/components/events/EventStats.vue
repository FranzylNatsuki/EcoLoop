<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  stats?: {
    total_pledged?: number
    total_donors?: number
  }
}>()

const donatedItemsFormatted = computed(() => {
  return (props.stats?.total_pledged || 0).toLocaleString()
})

const contributorsFormatted = computed(() => {
  return (props.stats?.total_donors || 0).toLocaleString()
})
</script>

<template>
  <section class="event-stats">
    <div class="stat-card">
      <div class="stat-value">{{ donatedItemsFormatted }}</div>
      <div class="stat-label">Items Donated</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{{ contributorsFormatted }}</div>
      <div class="stat-label">Contributors</div>
    </div>
  </section>
</template>

<style scoped>
.event-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2e7d32;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
