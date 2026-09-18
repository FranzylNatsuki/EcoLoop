<script setup lang="ts">
</script>

<template>
	<div class="page-layout">
		<main class="page-content">
			<slot name="main" />
		</main>

		<aside class="right-sidebar">
			<slot name="sidebar" />
		</aside>
	</div>
</template>
