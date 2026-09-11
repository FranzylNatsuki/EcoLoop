<script setup lang="ts">
import SidebarNavigation from '../navigation/SidebarNavigation.vue'
</script>

<template>
	<div class="page-layout">
		<SidebarNavigation />

		<main class="page-content">
			<slot name="main" />
		</main>

		<aside class="right-sidebar">
			<slot name="sidebar" />
		</aside>
	</div>
</template>
