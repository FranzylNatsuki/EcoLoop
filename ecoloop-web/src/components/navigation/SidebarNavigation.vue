<script setup lang="ts">
import { Flame, Clock, ArrowUp, TrendingUp, Calendar, ShoppingBag } from 'lucide-vue-next'

interface NavItem {
  label: string
  icon: any
  active?: boolean
  to?: string
}

const items: NavItem[] = [
  { label: 'Hot', icon: Flame, active: true },
  { label: 'New', icon: Clock },
  { label: 'Top', icon: ArrowUp },
  { label: 'Rising', icon: TrendingUp },
  { label: 'Events', icon: Calendar, to: '/events' },
  { label: 'Marketplace', icon: ShoppingBag, to: '/marketplace' },
]
</script>

<template>
  <nav class="sidebar-navigation">
    <h2>Navigation</h2>
    <div class="divider" />

    <template v-for="item in items" :key="item.label">
      <!-- RouterLink for Marketplace (and any items with a 'to' prop) -->
      <RouterLink
        v-if="item.to"
        :to="item.to"
        custom
        v-slot="{ navigate, isActive }"
      >
        <button
          class="nav-item"
          :class="{ 'nav-item--active': isActive || item.active }"
          @click="navigate"
        >
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </button>
      </RouterLink>

      <!-- Standard Button for static tabs -->
      <button
        v-else
        class="nav-item"
        :class="{ 'nav-item--active': item.active }"
      >
        <component :is="item.icon" :size="16" />
        <span>{{ item.label }}</span>
      </button>
    </template>
  </nav>
</template>
