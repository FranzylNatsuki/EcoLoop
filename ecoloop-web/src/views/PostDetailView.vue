<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// Existing shared layout components
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'

// View-specific components
import PostDetailHeader from '../components/posts/PostDetailHeader.vue'
import PostMaterialList from '../components/posts/PostMaterialList.vue'
import PostCommentSection from '../components/posts/PostCommentSection.vue'
import AuthorCard from '../components/sidebar/AuthorCard.vue'
import RelatedPosts from '../components/sidebar/RelatedPosts.vue'

import type { Material } from '../components/posts/PostMaterialItem.vue'

interface RawAuthor {
  name: string
  avatar: string
}

interface RawPost {
  id: number
  title: string
  body: string
  image?: string
  votes: number
  comments: number | any[]
  category: string
  createdAt: string
  author: RawAuthor
  materials?: Array<string | Partial<Material>>
}

const route = useRoute()
const rawPost = ref<RawPost | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

async function fetchPostDetail() {
  isLoading.value = true
  error.value = null

  try {
    const res = await fetch(`http://localhost:3001/posts/${route.params.id}`)
    if (!res.ok) throw new Error('Post not found')
    rawPost.value = await res.json()
  } catch (err: any) {
    console.error('Failed to fetch post details:', err)
    error.value = err.message || 'Failed to load post details'
  } finally {
    isLoading.value = false
  }
}

// 1. Sanitize the post object so `comments` is strictly a `number` for PostDetailHeader
const post = computed(() => {
  if (!rawPost.value) return null

  const commentCount = Array.isArray(rawPost.value.comments)
    ? rawPost.value.comments.length
    : (rawPost.value.comments ?? 0)

  return {
    ...rawPost.value,
    comments: commentCount
  }
})

// 2. Default fallback materials if json-server doesn't provide them yet
const defaultMaterials: Material[] = [
  { id: 1, name: 'Glass Bottles', subtitle: 'Wine / juice bottles', current: 18, total: 25, unitLabel: 'bottles', progressRatioLabel: '86 / 120', isFulfilled: false },
  { id: 2, name: 'Gravel / Pebbles', subtitle: 'Small decorative stones', current: 3, total: 5, unitLabel: 'bags', progressRatioLabel: '72 / 120', isFulfilled: false },
  { id: 3, name: 'Cotton Twine', subtitle: 'Natural cotton wick material', current: 1, total: 1, unitLabel: 'spools', progressRatioLabel: 'Fulfilled', isFulfilled: true }
]

const formattedMaterials = computed<Material[]>(() => {
  if (!rawPost.value?.materials || rawPost.value.materials.length === 0) {
    return defaultMaterials
  }

  return rawPost.value.materials.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: index + 1,
        name: item,
        subtitle: 'Material contribution needed',
        current: 0,
        total: 1,
        unitLabel: 'pcs',
        progressRatioLabel: '0 / 1 pcs',
        isFulfilled: false
      }
    }

    return {
      id: item.id ?? index + 1,
      name: item.name ?? 'Unknown Material',
      subtitle: item.subtitle ?? 'Material contribution needed',
      current: item.current ?? 0,
      total: item.total ?? 1,
      unitLabel: item.unitLabel ?? 'pcs',
      progressRatioLabel: item.progressRatioLabel ?? `${item.current ?? 0} / ${item.total ?? 1}`,
      isFulfilled: item.isFulfilled ?? false
    }
  })
})

// 3. Default comments feed if none exist in json-server response
const commentsData = computed(() => {
  if (Array.isArray(rawPost.value?.comments) && rawPost.value.comments.length > 0) {
    return rawPost.value.comments
  }

  return [
    {
      id: 1,
      author: 'green_thumb',
      avatarInitial: 'G',
      timeAgo: '1 hour ago',
      content: 'I have a few cleaned wine bottles that might work for this.'
    },
    {
      id: 4,
      author: 'eco_warrior99',
      avatarInitial: 'E',
      timeAgo: '22 minutes ago',
      content: 'This is a really cool way to reuse old bottles!',
      replies: [
        {
          id: 5,
          author: 'nature_craft',
          avatarInitial: 'N',
          isAuthor: true,
          timeAgo: '10 minutes ago',
          content: "Thanks! I'll post an update once everything is planted."
        }
      ]
    }
  ]
})

// 4. Author metadata formatting
const authorProfile = computed(() => ({
  name: post.value?.author.name || 'nature_craft',
  avatar: post.value?.author.avatar || 'https://placehold.co/44x44',
  karma: 14200,
  bio: 'Loves turning everyday waste into useful things. Sharing practical upcycling projects with the community.',
  tipsShared: 238,
  upcycles: 1200,
  rankingCategory: 'Upcycling',
  rankingPosition: '#1',
  joinedYear: '2024' // Changed from 2024 (number) to '2024' (string)
}))

const relatedPosts = [
  { id: 101, title: 'DIY automatic watering system with plastic soda bottles', votes: 182, category: 'Upcycling' },
  { id: 102, title: 'Cleaned wine bottle decorative candle holders guide', votes: 95, category: 'Upcycling' }
]

watch(() => route.params.id, () => {
  if (route.params.id) fetchPostDetail()
})

onMounted(() => {
  fetchPostDetail()
})
</script>

<template>
  <div v-if="isLoading" class="state-card">
    Loading post details...
  </div>

  <div v-else-if="error" class="state-card error">
    <p>{{ error }}</p>
    <RouterLink to="/" class="back-link">← Back to Feed</RouterLink>
  </div>

  <PageLayout v-else-if="post">
    <template #main>
      <BackButton />
      <PostDetailHeader :post="post" />
      <PostMaterialList
        :materials="formattedMaterials"
        :fulfilled-count="formattedMaterials.filter(m => m.isFulfilled).length"
        :total-count="formattedMaterials.length"
      />
      <PostCommentSection :comments="commentsData" />
    </template>

    <template #sidebar>
      <AuthorCard :author="authorProfile" />
      <CommunityRules />
      <RelatedPosts :posts="relatedPosts" />
    </template>
  </PageLayout>

  <div v-else class="post-not-found">
    <h1>Post not found</h1>
    <p>The post you're looking for doesn't exist.</p>
  </div>
</template>

<style scoped>
.state-card {
  max-width: 600px;
  margin: 80px auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 12px;
  text-align: center;
  color: #666;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.state-card.error {
  color: #d32f2f;
}

.back-link {
  display: inline-block;
  margin-top: 12px;
  color: #2e7d32;
  text-decoration: none;
  font-weight: 600;
}

.post-not-found {
  max-width: 600px;
  margin: 80px auto;
  text-align: center;
}
</style>
