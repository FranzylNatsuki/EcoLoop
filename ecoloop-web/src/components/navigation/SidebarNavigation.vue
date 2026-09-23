<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Flame, Clock, ArrowUp, TrendingUp, Calendar, ShoppingBag } from 'lucide-vue-next'
import { useSort } from '../../composables/useSort'

const route = useRoute()
const router = useRouter()
const { selectedSort, setSort } = useSort()

const sortItems = [
  { label: 'Hot', icon: Flame },
  { label: 'New', icon: Clock },
  { label: 'Top', icon: ArrowUp },
  { label: 'Rising', icon: TrendingUp },
]

const pageItems = [
  { label: 'Events', icon: Calendar, to: '/events' },
  { label: 'Marketplace', icon: ShoppingBag, to: '/marketplace' },
]

function handleSortClick(label: string) {
  setSort(label)

  // Redirect to home if user is on another page when clicking a sort option
  if (route.path !== '/home' && route.path !== '/') {
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
      :class="{ 'nav-item--active': selectedSort === item.label && (route.path === '/home' || route.path === '/') }"
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
