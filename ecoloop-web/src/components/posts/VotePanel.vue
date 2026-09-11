<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'

const props = defineProps<{ votes: number }>()
const emit = defineEmits<{ upvote: []; downvote: [] }>()

const voteState = ref<'up' | 'down' | null>(null)

function handleUpvote() {
	voteState.value = voteState.value === 'up' ? null : 'up'
	emit('upvote')
}
function handleDownvote() {
	voteState.value = voteState.value === 'down' ? null : 'down'
	emit('downvote')
}
</script>

<template>
	<div class="vote-panel">
		<button class="vote-button" :class="{ 'vote-button--active': voteState === 'up' }"
			@click="handleUpvote">
			<ArrowUp :size="16" />
		</button>

		<span class="vote-count">{{ props.votes }}</span>

		<button class="vote-button" :class="{ 'vote-button--active': voteState === 'down' }"
			@click="handleDownvote">
			<ArrowDown :size="16" />
		</button>
	</div>
</template>
