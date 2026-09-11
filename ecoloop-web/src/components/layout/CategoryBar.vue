<script setup lang="ts">
const categories = ['Composting', 'Upcycling', 'Zero Waste', 'E-Waste']
</script>

<template>
	<nav class="categories-bar">
		<button v-for="category in categories" :key="category" class="category-pill">
			{{ category }}
		</button>
	</nav>
</template>
