<script setup lang="ts">
import { computed } from 'vue'
import PostActions from './PostActions.vue'
import VotePanel from './VotePanel.vue'


const props = defineProps<{
  post: any
  images: any[]
  isOwner?: boolean // <-- Make sure this is here!
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
  <article class="detail-post">
    <!-- Updated: vote_count -->
    <VotePanel :votes="post.vote_count" @click.stop />

    <div class="detail-post-content">
      <div class="detail-post-meta">
        <div class="author-info">
          <!-- Updated: Use computed avatarUrl -->
        <RouterLink :to="`/user/${post.author_id}`">
          <img :src="avatarUrl" :alt="post.author.full_name" class="detail-avatar" />
        </RouterLink>
          <span>Posted by
               <RouterLink :to="`/user/${post.author_id}`">
                   <strong> {{ post.author.full_name }}
                   </strong>
               </RouterLink>
          </span>
          <span>•</span>
          <!-- Updated: Use computed formattedDate -->
          <span>{{ formattedDate }}</span>
        </div>
        <span class="detail-category">{{ post.category }}</span>
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
          style="margin: 5px 10px 26px 5px;"
        />
      </div>

      <!-- Updated: comment_count -->
      <PostActions
            :comments="post.comment_count"
            :post-id="post.id"
            :is-owner="isOwner"
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
