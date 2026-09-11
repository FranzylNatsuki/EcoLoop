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
				<span class="author-name">{{ post.author.name }}</span>
				<span class="meta-dot">•</span>
				<span class="time-ago">{{ post.createdAt }}</span>
				<span class="category">{{ post.category }}</span>
			</div>

			<h2>{{ post.title }}</h2>
			<p>{{ post.body }}</p>

			<img v-if="post.image" :src="post.image" :alt="post.title" class="post-image" />

			<PostActions :comments="post.comments" />
		</div>
	</article>
</template>

<style scoped>
/* ==========================================================================
   POST CARD CONTAINER
   ========================================================================== */
.post-card {
	background: #ffffff;
	border: 1px solid #e4e7e3;
	border-radius: 12px;
	display: flex;
	overflow: hidden;
	width: 100%;
	box-sizing: border-box;
}

/* ==========================================================================
   POST CONTENT & META
   ========================================================================== */
.post-content {
	flex: 1;
	min-width: 0;
	padding: 16px;
}

.post-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: #525a52;
	margin-bottom: 8px;
}

/* Perfect Circle Avatar Fix */
.post-meta .avatar,
.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
}

.author-name {
	font-weight: 600;
	color: #1a1d1a;
}

.meta-dot {
	color: #8f9a8f;
}

.category {
	margin-left: auto;
	padding: 4px 8px;
	border-radius: 4px;
	background: rgba(119, 135, 50, 0.1);
	color: #778732;
	font-family: 'Outfit', sans-serif;
	font-size: 12px;
	font-weight: 600;
}

/* ==========================================================================
   TITLE, BODY & POST ATTACHED IMAGE
   ========================================================================== */
.post-content h2 {
	margin: 0 0 8px;
	font-family: 'Outfit', sans-serif;
	font-size: 18px;
	font-weight: 600;
	line-height: 1.35;
	color: #1a1d1a;
}

.post-content p {
	margin: 0 0 16px;
	color: #525a52;
	font-size: 14px;
	line-height: 1.5;
}

.post-image {
	width: 100%;
	max-height: 360px;
	object-fit: cover;
	border-radius: 8px;
	display: block;
	margin-bottom: 12px;
}
</style>
