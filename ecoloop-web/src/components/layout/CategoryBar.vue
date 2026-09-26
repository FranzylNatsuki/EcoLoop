<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps<{
  type?: 'events' | 'marketplace' | 'posts'
}>()

const router = useRouter()
const route = useRoute()

const categories = computed(() => {
  if (props.type === 'events') {
    return [
      'All',
      'Volunteering',
      'Fundraiser',
      'Workshop',
      'Clean-up',
      'Gardening',
      'Crafts & DIY',
      'Upcycling',
      'Tree Planting'
    ]
  } else if (props.type === 'marketplace') {
    return [
      'All',
      'Plastics',
      'Glass',
      'Paper/Cardboard',
      'Metal',
      'Electronics'
    ]
  }
  
  // Default (Posts / Home Feed)
  return [
    'All',
    'Gardening',
    'Composting',
    'Upcycling',
    'Crafts & DIY',
    'Zero Waste',
    'E-Waste'
  ]
})

function selectCategory(category: string) {
  const query = { ...route.query }

  if (category === 'All') {
    delete query.category
  } else {
    query.category = category
  }

  router.push({ path: route.path, query })
}

function isActive(category: string) {
  const current = (route.query.category as string || '')
  if (category === 'All') {
    return current === '' || current.toLowerCase() === 'all'
  }
  return current.toLowerCase() === category.toLowerCase()
}
</script>

<template>
  <nav class="categories-bar" v-if="categories.length > 1">
    <button
      v-for="category in categories"
      :key="category"
      class="category-pill"
      :class="{ 'category-pill--active': isActive(category) }"
      @click="selectCategory(category)"
    >
      {{ category }}
    </button>
  </nav>
</template>

<style scoped>
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-pill {
  padding: 8px 20px;
  border-radius: 24px;
  border: 1.5px solid transparent;
  background: #f0f2ef;
  color: #3f463f;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-pill:hover { 
  background: #e4e7e3; 
  transform: translateY(-1px);
}

.category-pill--active { 
  background: #778732; 
  color: #ffffff; 
  box-shadow: 0 4px 12px rgba(119, 135, 50, 0.25);
  transform: translateY(-1px);
}
</style>
