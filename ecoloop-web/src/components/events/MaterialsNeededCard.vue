<script setup lang="ts">
import MaterialRow from './MaterialRow.vue'

defineProps<{
  materials?: Array<{
    material?: string
    name?: string
    description?: string
    current: number
    target: number
    unit: string
    image?: string
  }>
}>()

const emit = defineEmits<{
  (e: 'open-donate', materialName?: string): void
}>()

function handleDonate(materialName: string) {
  console.log('Donating to:', materialName)
  emit('open-donate', materialName)
}
</script>

<template>
  <section class="materials-card">
    <div class="section-heading">
      <h2>Materials Needed</h2>
      <p>
        We're collecting materials for this project. Every donation helps us build faster.
      </p>
    </div>

    <div class="materials-list" v-if="materials && materials.length > 0">
      <MaterialRow
        v-for="(item, index) in materials"
        :key="index"
        :material="{
          name: item.material || item.name || 'Material',
          description: item.description || '',
          current: item.current || 0,
          target: item.target || 1,
          unit: item.unit || 'pcs',
          image: item.image || 'https://placehold.co/80x80'
        }"
        @donate="handleDonate(item.material || item.name || '')"
      />
    </div>
    <p v-else class="empty-text">No specific materials listed for this event.</p>
  </section>
</template>

<style scoped>
.materials-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-heading h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.section-heading p {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 24px;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-text {
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>
