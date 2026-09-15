<script setup lang="ts">
import { computed } from 'vue'
import PostMaterialItem, { type Material } from './PostMaterialItem.vue'

const props = withDefaults(
  defineProps<{
    materials: Material[]
  }>(),
  {
    materials: () => []
  }
)

const totalCount = computed(() => props.materials.length)
const fulfilledCount = computed(() => props.materials.filter(m => m.isFulfilled).length)
</script>

<template>
  <section v-if="materials.length > 0" class="detail-card">
    <div class="section-header">
      <div>
        <h2>Material Donations</h2>
        <p>Help provide the materials needed for this project.</p>
      </div>
      <span class="fulfillment-summary">
        {{ fulfilledCount }} of {{ totalCount }} items fulfilled
      </span>
    </div>

    <PostMaterialItem
      v-for="item in materials"
      :key="item.id"
      :material="item"
    />
  </section>
</template>

<style scoped>
.detail-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0 0 4px;
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d1a;
}

.section-header p {
  margin: 0;
  color: #8f9a8f;
  font-size: 13px;
}

.fulfillment-summary {
  color: #778732;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
