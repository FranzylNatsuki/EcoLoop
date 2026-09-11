<script setup lang="ts">
import { Flame, Clock, ArrowUp, TrendingUp, Calendar, ShoppingBag } from 'lucide-vue-next'

const items = [
	{ label: 'Hot', icon: Flame, active: true },
	{ label: 'New', icon: Clock },
	{ label: 'Top', icon: ArrowUp },
	{ label: 'Rising', icon: TrendingUp },
	{ label: 'Events', icon: Calendar },
	{ label: 'Marketplace', icon: ShoppingBag },
]
</script>

<template>
	<nav class="sidebar-navigation">
		<h2>Navigation</h2>
		<div class="divider" />

		<button v-for="item in items" :key="item.label" class="nav-item"
			:class="{ 'nav-item--active': item.active }">
			<component :is="item.icon" :size="16" />
			<span>{{ item.label }}</span>
		</button>
	</nav>
</template>
