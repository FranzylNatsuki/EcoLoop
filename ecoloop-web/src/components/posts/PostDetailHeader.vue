<script setup lang="ts">
import PostActions from './PostActions.vue'
import VotePanel from './VotePanel.vue'

interface Author {
  name: string
  avatar: string
}

interface Post {
  id: string | number
  title: string
  body: string
  image?: string
  votes: number
  comments: number
  category: string
  createdAt: string
  author: Author
}

defineProps<{ post: Post }>()
</script>

<template>
  <article class="detail-post">
    <VotePanel :votes="post.votes" @click.stop />

    <div class="detail-post-content">
      <div class="detail-post-meta">
        <div class="author-info">
          <img :src="post.author.avatar" :alt="post.author.name" class="detail-avatar" />
          <span>Posted by <strong>u/{{ post.author.name }}</strong></span>
          <span>•</span>
          <span>{{ post.createdAt }}</span>
        </div>
        <span class="detail-category">{{ post.category }}</span>
      </div>

      <h1>{{ post.title }}</h1>
      <p class="detail-body">{{ post.body }}</p>
      <img v-if="post.image" :src="post.image" :alt="post.title" class="detail-image" />

      <PostActions :comments="post.comments" :hide-comments="true" />
    </div>
  </article>
</template>

<style scoped>
.detail-post {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  display: flex;
  overflow: hidden;
  margin-bottom: 16px;
}
.detail-post-content { flex: 1; min-width: 0; padding: 20px; }
.detail-post-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; color: #8f9a8f; }
.author-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
.author-info strong { color: #1a1d1a; }
.detail-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.detail-category { margin-left: auto; padding: 5px 10px; border-radius: 999px; background: rgba(119, 135, 50, 0.1); color: #778732; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; white-space: nowrap; }
.detail-post-content h1 { margin: 0 0 12px; font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.3; color: #1a1d1a; }
.detail-body { margin: 0 0 18px; color: #525a52; font-size: 14px; line-height: 1.65; white-space: pre-line; }
.detail-image { width: 100%; max-height: 420px; object-fit: cover; display: block; border-radius: 10px; }
</style>
