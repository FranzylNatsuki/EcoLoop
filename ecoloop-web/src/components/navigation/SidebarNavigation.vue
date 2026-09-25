<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Flame, Clock, Layers, MapPin, Megaphone, Calendar, ShoppingBag } from 'lucide-vue-next'
import { useSort } from '../../composables/useSort'

const route = useRoute()
const router = useRouter()
const { selectedSort, setSort } = useSort()

const sortItems = [
  { label: 'Hot', icon: Flame },
  { label: 'New', icon: Clock },
  { label: 'Nearest', icon: MapPin },
]

const pageItems = [
  { label: 'All posts', icon: Layers, to: '/home' },
  { label: 'Cause Requests', icon: Megaphone, to: '/home?category=cause'},
  { label: 'Events', icon: Calendar, to: '/events' },
  { label: 'Marketplace', icon: ShoppingBag, to: '/marketplace' },
]

function handleSortClick(label: string) {
  setSort(label)

  // Allow sorting to happen in place on home, root, and marketplace
  const allowedSortPaths = ['/home', '/', '/marketplace']
  if (!allowedSortPaths.includes(route.path)) {
    router.push('/home')
  }
}
</script>

<template>
  <nav class="sidebar-navigation">
    <h2>Navigation</h2>
    <div class="divider" />

    <!-- Sort Filters -->
    <button
      v-for="item in sortItems"
      :key="item.label"
      class="nav-item"
      :class="{
        'nav-item--active': selectedSort === item.label && ['/home', '/', '/marketplace'].includes(route.path)
      }"
      @click="handleSortClick(item.label)"
    >
      <component :is="item.icon" :size="16" />
      <span>{{ item.label }}</span>
    </button>

    <div class="divider" />

    <!-- Page Navigation -->
    <RouterLink
      v-for="item in pageItems"
      :key="item.label"
      :to="item.to"
      custom
      v-slot="{ navigate, isActive }"
    >
      <button
        class="nav-item"
        :class="{ 'nav-item--active': isActive }"
        @click="navigate"
      >
        <component :is="item.icon" :size="16" />
        <span>{{ item.label }}</span>
      </button>
    </RouterLink>
  </nav>
</template>
