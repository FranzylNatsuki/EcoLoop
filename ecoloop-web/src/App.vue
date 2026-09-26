<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import ToastContainer from './components/common/ToastContainer.vue'

const route = useRoute()
</script>

<template>
	<AppHeader class="sticky-header" v-if="!route.meta.hideHeader" />
	<RouterView :key="route.fullPath" />
	<ToastContainer />
</template>

<style scoped>
.sticky-header {
	position: sticky;
	top: 0;
	z-index: 100; /* Ensures the header stays above your scrolling content */
}
</style>
