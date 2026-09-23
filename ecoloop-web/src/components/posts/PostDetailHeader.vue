<script setup lang="ts">
import { computed } from 'vue'
import PostActions from './PostActions.vue'

const props = defineProps<{
  post: any
  images: any[]
  isOwner?: boolean
}>()

// Safely extract the avatar URL from the JSON object or fallback
const avatarUrl = computed(() => {
  const avatarData = props.post.author?.Avatar

  if (typeof avatarData === 'string') return avatarData
  // If it's a JSON object like {"avatar": "url..."}
  if (avatarData && typeof avatarData === 'object' && avatarData.avatar) return avatarData.avatar

  return 'https://placehold.co/38x38' // Fallback
})

// Format the date nicely
const formattedDate = computed(() => {
  if (!props.post.created_at) return ''
  const date = new Date(props.post.created_at)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})
</script>

<template>
  <article class="detail-post" :class="{ 'is-completed': post.is_completed }">
    <div class="detail-post-content">
      <div class="detail-post-meta">
        <div class="author-info">
          <!-- Updated: Use computed avatarUrl -->
          <RouterLink :to="`/user/${post.author_id}`">
            <img :src="avatarUrl" :alt="post.author.full_name" class="detail-avatar" />
          </RouterLink>
          <span>Posted by
            <RouterLink :to="`/user/${post.author_id}`" class="author-link">
              <strong> {{ post.author.full_name }} </strong>
            </RouterLink>
          </span>
          <span>•</span>
          <!-- Updated: Use computed formattedDate -->
          <span>{{ formattedDate }}</span>
        </div>

        <!-- Switch between Category and Completed Badge -->
        <span v-if="post.is_completed" class="completed-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Completed
        </span>
        <span v-else class="detail-category">{{ post.category }}</span>
      </div>

      <h1>{{ post.title }}</h1>
      <p class="detail-body">{{ post.body }}</p>

      <!-- Render multiple images if they exist -->
      <div v-if="images && images.length > 0" class="image-gallery">
        <img
          v-for="(img, idx) in images"
          :key="idx"
          :src="img.image_url"
          :alt="post.title"
          class="detail-image"
          style="margin: 5px 10px 26px 0;"
        />
      </div>

      <PostActions
        :votes="post.vote_count"
        :comments="post.comment_count"
        :post-id="post.id"
        :is-owner="isOwner"
        :is-completed="post.is_completed"
        :project-name="post.title"
        :author-username="post.author.full_name"
      />
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
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

/* Completed State Styles */
.detail-post.is-completed {
  background: #fcfdfc;
}

.detail-post.is-completed h1,
.detail-post.is-completed .detail-body {
  opacity: 0.7;
}

.detail-post-content {
  flex: 1;
  min-width: 0;
  padding: 20px;
}

.detail-post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #8f9a8f;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.author-link {
  text-decoration: none;
  color: inherit;
}

.author-link:hover {
  text-decoration: underline;
}

.author-info strong {
  color: #1a1d1a;
}

.detail-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.detail-category {
  margin-left: auto;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(119, 135, 50, 0.1);
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

/* Completed Badge Styles */
.completed-badge {
  margin-left: auto;
  padding: 5px 10px;
  border-radius: 999px;
  background: #e4e7e3;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-post-content h1 {
  margin: 0 0 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1d1a;
}

.detail-body {
  margin: 0 0 18px;
  color: #525a52;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-line;
}

.detail-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
