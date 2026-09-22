<script setup lang="ts">
import { ref, computed } from 'vue'
import DonateMaterialsModal from '../Modals/DonateMaterialsModal.vue'

export interface Material {
  id: string | number
  name: string
  subtitle: string
  current: number
  total: number
  unitLabel: string
  progressRatioLabel: string
  isFulfilled: boolean
}

const props = defineProps<{ material: Material }>()
const showDonateModal = ref(false)

const percentage = computed(() => {
  if (props.material.isFulfilled) return 100
  return Math.min(Math.round((props.material.current / props.material.total) * 100), 100)
})
</script>

<template>
  <div class="material-item">
    <div class="material-info">
      <div>
        <strong>{{ material.name }}</strong>
        <span>{{ material.subtitle }}</span>
      </div>
      <span>{{ material.current }} of {{ material.total }} {{ material.unitLabel }}</span>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :class="{ fulfilled: material.isFulfilled }" :style="{ width: `${percentage}%` }"></div>
    </div>

    <div class="material-footer">
      <span>{{ material.isFulfilled ? 'Fulfilled' : material.progressRatioLabel }}</span>
      <button v-if="!material.isFulfilled" class="donate-button" @click="showDonateModal = true">Donate</button>
      <button v-else class="donate-button fulfilled-button" disabled>Fulfilled</button>
    </div>

    <DonateMaterialsModal
      v-if="!material.isFulfilled"
      v-model="showDonateModal"
      :post-id="material.id"
    />
  </div>
</template>

<style scoped>
.material-item { padding: 16px 0; border-top: 1px solid #e4e7e3; }
.material-item:first-of-type { border-top: none; }
.material-info { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 9px; font-size: 12px; color: #8f9a8f; }
.material-info > div { display: flex; flex-direction: column; gap: 3px; }
.material-info strong { color: #1a1d1a; font-size: 14px; }
.progress-bar { width: 100%; height: 7px; background: #edf0ec; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: #778732; border-radius: inherit; }
.progress-fill.fulfilled { background: #9cac62; }
.material-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #8f9a8f; }
.donate-button { border: 1px solid #778732; background: transparent; color: #778732; border-radius: 7px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.donate-button:hover { background: rgba(119, 135, 50, 0.08); }
.fulfilled-button { background: #f1f3ee; border-color: #dfe4d8; color: #8f9a8f; cursor: default; }
</style>
