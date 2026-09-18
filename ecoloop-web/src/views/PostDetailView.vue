<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { supabase } from '../composables/useAuth'

import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import PostDetailHeader from '../components/posts/PostDetailHeader.vue'
import PostMaterialList from '../components/posts/PostMaterialList.vue'
import PostCommentSection from '../components/posts/PostCommentSection.vue'
import AuthorCard from '../components/sidebar/AuthorCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import RelatedPosts from '../components/sidebar/RelatedPosts.vue'

const route = useRoute()
const postId = route.params.id as string

const authorPostCount = ref(0)
const post = ref<any>(null)
const commentsData = ref<any[]>([]) // Changed from computed to a reactive ref
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const error = ref<string | null>(null)

async function fetchAuthorPostCount(authorId: string) {
  try {
    const { count, error } = await supabase
      .from('cause_requests') // Check that this is your actual posts table name
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)

    if (error) throw error
    if (count !== null) {
      authorPostCount.value = count
    }
  } catch (err) {
    console.error('Failed to fetch author post count:', err)
  }
}

// 1. Fetch Post Details
async function fetchPostDetails() {
  try {
    const { data, error: fetchError } = await supabase
          .from('cause_requests')
          .select(`
            *,
            author:profiles!author_id (
              full_name,
              created_at,
              profile_data ( Avatar, about, "Posts", "CommunityScore" )
            ),
            post_images ( image_url, display_order )
          `)
          .eq('id', postId)
          .single()

    if (fetchError) throw fetchError

    // 1. Bypass TS strictness on the raw data
    const rawData = data as any

    // 2. Safely extract author (in case Supabase returns it as an array)
    const authorRecord = Array.isArray(rawData.author) ? rawData.author[0] : rawData.author

    // 3. Safely extract profile_data (in case Supabase returns it as an array)
    const profileRecord = Array.isArray(authorRecord?.profile_data)
      ? authorRecord?.profile_data[0]
      : authorRecord?.profile_data

    // 4. Map the clean data
    post.value = {
          ...rawData,
          author: {
            ...authorRecord, // <--- THE FIX: This keeps created_at and the raw profile_data intact!
            full_name: authorRecord?.full_name || 'Unknown User',
            Avatar: profileRecord?.Avatar || 'https://placehold.co/38x38',
            about: profileRecord?.about || 'No bio available.'
          }
        }
  } catch (err: any) {
    console.error('Failed to fetch post details:', err)
    error.value = err.message || 'Failed to load post details.'
  }
}

async function fetchComments() {
  try {
    const { data, error: commentsError } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        author_id,
        author:profiles!author_id (
          full_name,
          profile_data ( Avatar )
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) throw commentsError

    commentsData.value = data.map((c: any) => {
          const authorRecord = Array.isArray(c.author) ? c.author[0] : c.author
          const profileRecord = Array.isArray(authorRecord?.profile_data)
            ? authorRecord?.profile_data[0]
            : authorRecord?.profile_data

          return {
                  id: c.id,
                  content: c.content,
                  authorId: c.author_id,
                  author: authorRecord?.full_name || 'Unknown User',
                  avatarInitial: (authorRecord?.full_name || 'U').charAt(0).toUpperCase(),
                  avatarUrl: profileRecord?.Avatar, // Pass the Supabase URL here
                  timeAgo: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }
        })
  } catch (err) {
    console.error('Failed to fetch comments:', err)
  }
}

// 3. Submit a new comment
async function handleAddComment(content: string) {
  if (!content.trim()) return

  isSubmittingComment.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Must be logged in to comment.')

    const { error: insertError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: session.user.id,
        content: content.trim()
      })

    if (insertError) throw insertError

    // Refresh the comments list instantly
    await fetchComments()
  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    isSubmittingComment.value = false
  }
}

onMounted(async () => {
  await fetchPostDetails()

    // If we successfully loaded the post, fetch the author's true post count
    if (post.value?.author_id) {
      await fetchAuthorPostCount(post.value.author_id)
    }

    await fetchComments()
    isLoading.value = false
})

// --- Computed Properties ---

// Safely sort images by upload order for the header component
const postImages = computed(() => {
  if (!post.value?.post_images) return []
  return [...post.value.post_images].sort((a, b) => a.display_order - b.display_order)
})

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

const formattedMaterials = computed<PostMaterial[]>(() => {
  if (!post.value?.materials || !Array.isArray(post.value.materials)) return []
  return post.value.materials.map((m: any, index: number) => {
    const currentAmount = m.current || 0
    const totalAmount = m.total || 1
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

const authorProfile = computed(() => {
  if (!post.value?.author) return null

  const profileRecord = Array.isArray(post.value.author.profile_data)
    ? post.value.author.profile_data[0]
    : post.value.author.profile_data

  const joinedYear = post.value.author.created_at
    ? new Date(post.value.author.created_at).getFullYear().toString()
    : 'Unknown'

  return {
    id: post.value.author_id, // <--- Add this!
    name: post.value.author.full_name,
    avatar: post.value.author.Avatar || 'https://placehold.co/38x38',
    bio: post.value.author.about,

    // Use our new direct database count!
    postCount: authorPostCount.value,

    communityScore: profileRecord?.CommunityScore || 0.0,
    joinedYear: joinedYear
  }
})

const relatedPosts = computed(() => [])
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
      <!-- Pass the sorted images along with the post data -->
      <PostDetailHeader :post="post" :images="postImages" />

      <PostMaterialList
        :materials="formattedMaterials"
        :fulfilled-count="fulfilledCount"
        :total-count="formattedMaterials.length"
      />

      <!-- Listen for the submit event from your comment component -->
      <PostCommentSection
        :comments="commentsData"
        :is-submitting="isSubmittingComment"
        @submit-comment="handleAddComment"
      />
    </template>

    <template #sidebar>
      <AuthorCard v-if="authorProfile" :author="authorProfile" />
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
