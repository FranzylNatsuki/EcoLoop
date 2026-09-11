<script setup lang="ts">
import { MessageCircle, Share2, Bookmark } from 'lucide-vue-next'

defineProps<{ comments: number }>()
defineEmits<{ share: []; save: []; donate: [] }>()
</script>

<template>
	<div class="post-footer">
		<button class="footer-action">
			<MessageCircle :size="14" />
			{{ comments }} Comments
		</button>

		<button class="footer-action" @click="$emit('share')">
			<Share2 :size="14" />
			Share
		</button>

		<button class="footer-action" @click="$emit('save')">
			<Bookmark :size="14" />
			Save
		</button>

		<button class="btn-donate" @click="$emit('donate')">
			Donate
		</button>
	</div>
</template>
