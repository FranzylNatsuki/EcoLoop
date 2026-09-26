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
    'E-Waste',
    'Clean-Up Drive',
    'Recycling Workshop',
    'Upcycling Event',
    'Tree Planting'
  ]
})

function selectCategory(category: string) {
  const query = { ...route.query }

  if (category === 'All') {
    delete query.category
  } else {
    query.category = category.toLowerCase() // NOTE: Restored old logic where it was lowercased!
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
  <nav class="categories-bar" v-if="categories.length > 1">
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

<style scoped>
/* Add the requested centering but keep all original styles */
.categories-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap; /* Good for responsiveness just in case */
}

/* Provide an explicit active state matching hover from global styles */
.category-pill.active {
  background: #f0f7f0;
  border-color: #a4ceaf;
}
</style>
