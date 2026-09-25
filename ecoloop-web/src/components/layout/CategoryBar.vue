<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const categories = [
  'All',
  // Post Categories
  'Gardening',
  'Composting',
  'Upcycling',
  'Crafts & DIY',
  'Zero Waste',
  'E-Waste',
  // Event Categories
  'Clean-Up Drive',
  'Recycling Workshop',
  'Upcycling Event',
  'Tree Planting',
]

function selectCategory(category: string) {
  const query = { ...route.query }

  if (category === 'All') {
    delete query.category
  } else {
    query.category = category.toLowerCase()
  }

  router.push({ path: route.path, query })
}

function isActive(category: string) {
  const current = (route.query.category as string || '').toLowerCase()
  if (category === 'All') {
    return !current || current === 'all'
  }
  return current === category.toLowerCase()
}
</script>

<template>
  <nav class="categories-bar">
    <button
      v-for="category in categories"
      :key="category"
      class="category-pill"
      :class="{ active: isActive(category) }"
      @click="selectCategory(category)"
    >
      {{ category }}
    </button>
  </nav>
</template>
