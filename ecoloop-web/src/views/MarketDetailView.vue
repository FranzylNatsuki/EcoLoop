<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { supabase } from '../composables/useAuth'
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import PostCommentSection from '../components/posts/PostCommentSection.vue'
import AuthorCard from '../components/sidebar/AuthorCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import RelatedPosts from '../components/sidebar/RelatedPosts.vue'

interface PurchaseRequest {
  id: string
  requester_id: string
  quantity: number | string | null
  material_name: string
  created_at: string
  requester?: {
    full_name?: string
    profile_data?: { Avatar?: string } | Array<{ Avatar?: string }>
  } | Array<{
    full_name?: string
    profile_data?: { Avatar?: string } | Array<{ Avatar?: string }>
  }>
}

const route = useRoute()
const getPostId = () => route.params.id as string
const post = ref<any>(null)
const commentsData = ref<any[]>([])
const purchaseRequests = ref<PurchaseRequest[]>([])
const selectedRequest = ref<PurchaseRequest | null>(null)
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const isLoadingRequests = ref(false)
const error = ref<string | null>(null)
const myId = ref<string | null>(null)

const isOwner = computed(() => Boolean(myId.value && post.value?.author_id === myId.value))

function getProfileRecord(profileData: any) {
  return Array.isArray(profileData) ? profileData[0] : profileData
}

function getAuthorRecord(author: any) {
  return Array.isArray(author) ? author[0] : author
}

async function fetchPostDetails() {
  const postId = getPostId()
  const tableName = 'marketplace_listings'

  console.log('Fetching marketplace item ID:', route.params.id, 'from table:', tableName)

  const { data, error: fetchError } = await supabase
    .from(tableName)
    .select(`
      *,
      author:profiles!author_id (
        full_name,
        created_at,
        profile_data ( Avatar, about, "Posts", "CommunityScore" )
      )
    `)
    .eq('id', postId)
    .maybeSingle()

  console.log('Fetched data:', data, 'Error:', fetchError)

  if (fetchError) throw fetchError

  if (!data) {
    console.log(`[MarketDetailView] No record found in ${tableName} for ID: ${postId}`)
    error.value = 'Marketplace listing not found or has been deleted.'
    return
  }

  const authorRecord = getAuthorRecord(data.author)
  const profileRecord = getProfileRecord(authorRecord?.profile_data)

  post.value = {
    ...data,
    author: {
      ...authorRecord,
      full_name: authorRecord?.full_name || 'Unknown User',
      Avatar: profileRecord?.Avatar || 'https://placehold.co/38x38',
      about: profileRecord?.about || 'No bio available.'
    }
  }
}

async function fetchPurchaseRequests() {
  if (!post.value || !isOwner.value) return

  isLoadingRequests.value = true
  try {
    const { data, error: requestsError } = await supabase
      .from('marketplace_purchase_requests')
      .select(`
        id,
        requester_id,
        quantity,
        material_name,
        created_at,
        requester:profiles!requester_id (
          full_name,
          profile_data ( Avatar )
        )
      `)
      .eq('listing_id', getPostId())
      .order('created_at', { ascending: false })

    if (requestsError) throw requestsError
    purchaseRequests.value = (data || []) as PurchaseRequest[]
  } catch (err) {
    console.error('Failed to fetch purchase requests:', err)
  } finally {
    isLoadingRequests.value = false
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
      .eq('post_id', getPostId())
      .order('created_at', { ascending: true })

    if (commentsError) throw commentsError

    commentsData.value = (data || []).map((comment: any) => {
      const author = getAuthorRecord(comment.author)
      const profile = getProfileRecord(author?.profile_data)
      return {
        id: comment.id,
        content: comment.content,
        authorId: comment.author_id,
        author: author?.full_name || 'Unknown User',
        avatarInitial: (author?.full_name || 'U').charAt(0).toUpperCase(),
        avatarUrl: profile?.Avatar,
        timeAgo: new Date(comment.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }
    })
  } catch (err) {
    console.error('Failed to fetch comments:', err)
  }
}

async function handleAddComment(content: string) {
  if (!content.trim()) return

  isSubmittingComment.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Must be logged in to comment.')

    const { error: insertError } = await supabase
      .from('post_comments')
      .insert({
        post_id: getPostId(),
        author_id: session.user.id,
        content: content.trim()
      })

    if (insertError) throw insertError
    await fetchComments()
  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    isSubmittingComment.value = false
  }
}

async function loadPage() {
  isLoading.value = true
  error.value = null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    myId.value = session?.user.id || null
    await fetchPostDetails()

    if (post.value) {
      await Promise.all([fetchPurchaseRequests(), fetchComments()])
    }
  } catch (err: any) {
    console.error('Failed to load marketplace details:', err)
    error.value = err.message || 'Failed to load marketplace listing.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPage)

const authorProfile = computed(() => {
  if (!post.value?.author) return null

  const profileRecord = getProfileRecord(post.value.author.profile_data)
  return {
    id: post.value.author_id,
    name: post.value.author.full_name,
    avatar: post.value.author.Avatar,
    bio: post.value.author.about,
    postCount: 0,
    communityScore: profileRecord?.CommunityScore || 0,
    joinedYear: post.value.author.created_at
      ? new Date(post.value.author.created_at).getFullYear().toString()
      : 'Unknown'
  }
})

const relatedPosts = computed(() => [])
</script>

<template>
  <div v-if="isLoading" class="state-card">Loading marketplace listing...</div>

  <div v-else-if="error" class="state-card error">
    <p>{{ error }}</p>
    <RouterLink to="/marketplace" class="back-link">← Back to Marketplace</RouterLink>
  </div>

  <PageLayout v-else-if="post">
    <template #main>
      <BackButton />

      <article class="detail-card listing-detail">
        <div class="listing-header">
          <div>
            <span class="category-label">{{ post.category }}</span>
            <h1>{{ post.title }}</h1>
            <p class="listing-meta">
              Posted by {{ post.author?.full_name || 'Unknown User' }}
              · {{ new Date(post.created_at).toLocaleDateString() }}
            </p>
          </div>
          <button class="buy-button" type="button">Buy / Request</button>
        </div>

        <div v-if="post.images?.length" class="image-gallery">
          <img
            v-for="(image, index) in post.images"
            :key="image.id || index"
            :src="image.image_url || image"
            :alt="post.title"
          />
        </div>

        <p class="listing-description">{{ post.description }}</p>

        <div class="listing-details">
          <div><strong>Price:</strong> {{ post.pricing_type === 'Free/Donation' ? 'Free' : post.price ?? 'Contact seller' }}</div>
          <div><strong>Quantity:</strong> {{ post.quantity ?? 'Available on request' }} {{ post.quantity_unit || '' }}</div>
          <div v-if="post.pricing_structure"><strong>Pricing:</strong> {{ post.pricing_structure }}</div>
        </div>
      </article>

      <section v-if="isOwner" class="detail-card purchase-requests">
        <div class="section-header">
          <h2>Purchase Requests</h2>
          <p>Review requests from community members.</p>
        </div>

        <p v-if="isLoadingRequests" class="muted-text">Loading requests...</p>
        <p v-else-if="purchaseRequests.length === 0" class="muted-text">No purchase requests yet.</p>
        <button
          v-for="request in purchaseRequests"
          v-else
          :key="request.id"
          class="request-card"
          type="button"
          @click="selectedRequest = request"
        >
          <img
            :src="getProfileRecord(getAuthorRecord(request.requester)?.profile_data)?.Avatar || 'https://placehold.co/44x44'"
            alt="Requester avatar"
            class="request-avatar"
          />
          <span class="request-info">
            <strong>{{ getAuthorRecord(request.requester)?.full_name || 'Unknown User' }}</strong>
            <small>{{ new Date(request.created_at).toLocaleString() }}</small>
          </span>
        </button>
      </section>

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

  <div v-else class="state-card">Marketplace listing not found.</div>

  <Teleport to="body">
    <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
      <div class="request-modal" role="dialog" aria-modal="true">
        <button class="modal-close" type="button" @click="selectedRequest = null">×</button>
        <h2>Purchase Request</h2>
        <p>
          <strong>{{ getAuthorRecord(selectedRequest.requester)?.full_name || 'Unknown User' }}</strong>
          requested this listing.
        </p>
        <p><strong>Material:</strong> {{ selectedRequest.material_name || post?.title }}</p>
        <p><strong>Quantity:</strong> {{ selectedRequest.quantity ?? 'Not specified' }}</p>
        <p><strong>Requested:</strong> {{ new Date(selectedRequest.created_at).toLocaleString() }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.detail-card { background: #fff; border: 1px solid #e4e7e3; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.listing-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.category-label { color: #778732; font-size: 12px; font-weight: 700; text-transform: uppercase; }
h1 { margin: 8px 0; color: #1a1d1a; }
.listing-meta, .muted-text { color: #8f9a8f; font-size: 13px; }
.buy-button { flex-shrink: 0; border: none; border-radius: 8px; background: #778732; color: #fff; padding: 11px 16px; font-weight: 700; cursor: pointer; }
.image-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 18px 0; }
.image-gallery img { width: 100%; height: 180px; border-radius: 8px; object-fit: cover; }
.listing-description { white-space: pre-wrap; line-height: 1.6; color: #3f463f; }
.listing-details { display: grid; gap: 8px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e4e7e3; color: #525a52; }
.section-header h2 { margin: 0 0 4px; color: #1a1d1a; }
.section-header p { margin: 0 0 16px; color: #8f9a8f; font-size: 13px; }
.request-card { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e4e7e3; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; margin-top: 8px; }
.request-card:hover { border-color: #778732; background: #f7f8f6; }
.request-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.request-info { display: flex; flex-direction: column; gap: 4px; }
.request-info small { color: #8f9a8f; }
.state-card { max-width: 600px; margin: 80px auto; padding: 32px; text-align: center; color: #666; }
.state-card.error { color: #d32f2f; }
.back-link { color: #2e7d32; font-weight: 600; }
.modal-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(0, 0, 0, .4); }
.request-modal { position: relative; width: min(420px, 100%); padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 16px 40px rgba(0, 0, 0, .2); }
.modal-close { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; font-size: 24px; cursor: pointer; }
@media (max-width: 600px) { .listing-header { flex-direction: column; } .buy-button { width: 100%; } }
</style>
