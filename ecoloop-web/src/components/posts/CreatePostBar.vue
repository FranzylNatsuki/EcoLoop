<script setup lang="ts">
import { FileUp, Share2 } from 'lucide-vue-next'

defineProps<{ avatar: string }>()
defineEmits<{ create: []; upload: []; share: [] }>()
</script>

<template>
	<div class="create-post-bar">
		<img class="author-avatar" :src="avatar" alt="Your avatar" />

		<button class="post-input" @click="$emit('create')">
			Create a post (share a recycling tip or DIY project)...
		</button>

		<button class="action-button" @click="$emit('upload')">
			<FileUp :size="20" />
		</button>

		<button class="action-button" @click="$emit('share')">
			<Share2 :size="20" />
		</button>
	</div>
</template>
