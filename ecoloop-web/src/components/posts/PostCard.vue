<script setup lang="ts">
import VotePanel from './VotePanel.vue'
import PostActions from './PostActions.vue'

interface Post {
	id: string | number
	title: string
	body: string
	image?: string
	votes: number
	comments: number
	category: string
	createdAt: string
	author: { name: string; avatar: string }
}

defineProps<{ post: Post }>()
</script>

<template>
	<article class="post-card">
		<VotePanel :votes="post.votes" />

		<div class="post-content">
			<div class="post-meta">
				<img :src="post.author.avatar" :alt="post.author.name" class="avatar" />
				<span>{{ post.author.name }}</span>
				<span>•</span>
				<span>{{ post.createdAt }}</span>
				<span class="category">{{ post.category }}</span>
			</div>

			<h2>{{ post.title }}</h2>
			<p>{{ post.body }}</p>

			<img v-if="post.image" :src="post.image" :alt="post.title" class="post-image" />

			<PostActions :comments="post.comments" />
		</div>
	</article>
</template>
