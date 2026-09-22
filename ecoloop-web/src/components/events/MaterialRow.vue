<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  material: {
    name: string
    description?: string
    current: number
    target: number
    unit: string
    image?: string
  }
}>()

const emit = defineEmits(['donate'])

const percent = computed(() => {
  if (!props.material.target) return 0
  return Math.min(100, Math.round((props.material.current / props.material.target) * 100))
})
</script>

<template>
  <div class="material-row-card">
    <div class="row-top">
      <div class="material-info">
        <img
          :src="material.image"
          :alt="material.name"
          class="material-thumb"
        />
        <div class="text-details">
          <h3>{{ material.name }}</h3>
          <p v-if="material.description">{{ material.description }}</p>
        </div>
      </div>

      <button class="donate-pill-btn" @click="emit('donate')">
        Donate
      </button>
    </div>

    <div class="row-bottom">
      <div class="progress-labels">
        <span class="count-text">
          {{ material.current }} of {{ material.target }} {{ material.unit }}
        </span>
        <span class="percent-text">{{ percent }}%</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${percent}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-row-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.material-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

.text-details h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.text-details p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.donate-pill-btn {
  background-color: #6e822d;
  color: #ffffff;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.donate-pill-btn:hover {
  background-color: #5a6b24;
}

.row-bottom {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.progress-track {
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #6e822d;
  border-radius: 4px;
}
</style>
