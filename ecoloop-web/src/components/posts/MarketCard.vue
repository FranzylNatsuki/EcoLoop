<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import VotePanel from './VotePanel.vue'
import PostActions from './PostActions.vue'
import PostActionsMarket from './PostActionsMarket.vue'
import MarketplaceInquiryModal from '../Modals/MarketplaceInquiryModal.vue'

// 1. Updated interface to match the Supabase data
interface PostImage {
  image_url: string
  display_order: number
}

interface Post {
  id: string | number
  title: string
  body: string
  post_images?: PostImage[]
  vote_count: number       // Changed from votes
  comment_count: number    // Changed from comments
  comments?: number
  category: string
  type?: string
  postType?: string
  price?: number | string
  pricingStructure?: string
  created_at: string       // Changed from createdAt
  author: { full_name: string; Avatar: string } // Changed from name/avatar
}

const props = defineProps<{ post: Post }>()
const router = useRouter()
const isInquiryModalOpen = ref(false)

console.log('Current post type:', props.post.type || props.post.postType)

// 2. Safely extract the first image to use as the cover
const coverImage = computed(() => {
  if (props.post.post_images && props.post.post_images.length > 0) {
    const sortedImages = [...props.post.post_images].sort((a, b) => a.display_order - b.display_order)
    return sortedImages[0].image_url
  }
  return null
})

// 3. Count any remaining images for the "+X" badge
const extraImagesCount = computed(() => {
  if (props.post.post_images && props.post.post_images.length > 1) {
    return props.post.post_images.length - 1
  }
  return 0
})

function openPost() {
  router.push(`/post/${props.post.id}`)
}
</script>

<template>
  <article class="post-card" @click="openPost">
    <!-- Updated: votes -> vote_count -->
    <VotePanel :votes="post.vote_count" @click.stop />

    <div class="post-content">
      <div class="post-meta">
        <!-- Updated: avatar -> Avatar, name -> full_name -->
        <img :src="post.author.Avatar" :alt="post.author.full_name" class="avatar" />
        <span class="author-name">{{ post.author.full_name }}</span>
        <span class="meta-dot">•</span>
        <!-- Updated: createdAt -> created_at (and formatted for readability) -->
        <span class="time-ago">{{ new Date(post.created_at).toLocaleDateString() }}</span>
        <span class="category">{{ post.category }}</span>
      </div>

      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>

      <!-- Updated: image -> coverImage (using the computed property) -->
      <div v-if="coverImage" class="image-container">
        <img :src="coverImage" :alt="post.title" class="post-image" />
        <!-- Badge for multiple images (if you added the computed property) -->
        <div v-if="extraImagesCount > 0" class="more-images-badge">
          +{{ extraImagesCount }}
        </div>
      </div>

      <PostActionsMarket
        v-if="post.type === 'marketplace' || post.postType === 'marketplace' || post.price !== undefined || post.pricingStructure !== undefined"
        :comments="post.comments || 0" :votes="post.vote_count"
        :post-id="post.id"
        @requestBuy="isInquiryModalOpen = true"
      />
      <PostActions
        v-else
        :comments="post.comments || 0" :votes="post.vote_count"
        :post-id="post.id"
      />

      <MarketplaceInquiryModal
        v-model="isInquiryModalOpen"
        :post="post"
      />
    </div>
  </article>
</template>

<style scoped>
.post-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  display: flex;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.post-card:hover {
  border-color: #cfd6cc;
  box-shadow: 0 2px 8px rgba(31, 41, 33, 0.06);
}

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
