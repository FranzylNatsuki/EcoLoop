<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { supabase } from '../composables/useAuth'

// Import your components (Make sure these paths are correct for your app)
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import PostDetailHeader from '../components/posts/PostDetailHeader.vue'
import PostMaterialList from '../components/posts/PostMaterialList.vue'
import PostCommentSection from '../components/posts/PostCommentSection.vue'
import AuthorCard from '../components/sidebar/AuthorCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import RelatedPosts from '../components/sidebar/RelatedPosts.vue'

const route = useRoute()
const post = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

async function fetchPostDetails() {
  try {
    const postId = route.params.id
    const { data, error: fetchError } = await supabase
      .from('cause_requests')
      .select(`
        *,
        author:profiles!author_id (
          full_name,
          profile_data ( Avatar, about )
        ),
        post_images ( image_url, display_order )
      `)
      .eq('id', postId)
      .single()

    if (fetchError) throw fetchError

    // Map it so it's clean for the template
    post.value = {
      ...data,
      author: {
        full_name: data.author?.full_name || 'Unknown User',
        Avatar: data.author?.profile_data?.Avatar || 'https://placehold.co/38x38',
        about: data.author?.profile_data?.about || 'No bio available.'
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch post details:', err)
    error.value = err.message || 'Failed to load post details.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPostDetails()
})

// 1. Match the child component's exact requirements
interface PostMaterial {
  id: string | number
  name: string
  subtitle: string
  current: number
  total: number
  unitLabel: string
  progressRatioLabel: string
  isFulfilled: boolean
}

// 2. Map the data safely, filling in blanks if the database doesn't have them yet
const formattedMaterials = computed<PostMaterial[]>(() => {
  if (!post.value?.materials || !Array.isArray(post.value.materials)) return []

  return post.value.materials.map((m: any, index: number) => {
    const currentAmount = m.current || 0
    const totalAmount = m.total || 1 // Avoid division by zero in child components

    return {
      id: m.id || `material-${index}`,
      name: m.name || 'Unknown Material',
      subtitle: m.subtitle || m.description || '',
      current: currentAmount,
      total: totalAmount,
      unitLabel: m.unitLabel || m.unit || 'units',
      progressRatioLabel: m.progressRatioLabel || `${currentAmount} / ${totalAmount}`,
      isFulfilled: !!m.isFulfilled || currentAmount >= totalAmount
    }
  })
})

const fulfilledCount = computed(() => {
  return formattedMaterials.value.filter(m => m.isFulfilled).length
})

// 2. Comments (Empty array until you build a comments table)
const commentsData = computed(() => {
  return []
})

// 3. Author Profile (Maps the Supabase joined data to the format your AuthorCard expects)
// 3. Author Profile (Provides a safe fallback object to satisfy TypeScript)
const authorProfile = computed(() => {
  if (!post.value?.author) {
    return {
      name: 'Loading...',
      avatar: 'https://placehold.co/38x38',
      about: 'Loading bio...',
      role: 'Community Member'
    }
  }

  return {
    name: post.value.author.full_name,
    avatar: post.value.author.Avatar,
    about: post.value.author.about,
    role: 'Community Member'
  }
})
// 4. Related Posts (Empty array until you write a query to fetch them)
const relatedPosts = computed(() => {
  return []
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
              :fulfilled-count="fulfilledCount"
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
