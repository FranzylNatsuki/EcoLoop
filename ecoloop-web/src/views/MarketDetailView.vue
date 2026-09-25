<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { supabase } from '../composables/useAuth'
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import PostCommentSection from '../components/posts/PostCommentSection.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import CreateMarketplaceModal from '../components/Modals/CreateMarketplaceModal.vue'
import AuthorCard from '../components/sidebar/AuthorCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import RelatedPosts from '../components/sidebar/RelatedPosts.vue'

interface PurchaseRequest {
  id: string
  buyer_id?: string
  seller_id?: string
  quantity?: number | string | null
  material_name?: string
  notes?: string | null
  status?: string
  created_at?: string
  buyer?: {
    id?: string
    username?: string
    full_name?: string
    avatar_url?: string
  } | null
}

const route = useRoute()
const getPostId = () => route.params.id as string
const post = ref<any>(null)
const commentsData = ref<any[]>([])
const purchaseRequests = ref<PurchaseRequest[]>([])
const selectedRequest = ref<PurchaseRequest | null>(null)
const showRequestModal = ref(false)
const selectedMaterial = ref('')
const requestedQuantity = ref(1)
const showEditModal = ref(false)
const showManageModal = ref(false)
const isUpdatingListing = ref(false)
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const isLoadingRequests = ref(false)
const isUpdatingRequest = ref(false)
const error = ref<string | null>(null)
const currentUser = ref<{ id: string } | null>(null)
const authLoading = ref(true)

const isOwner = computed(() => {
  const ownerId = post.value?.author_id || post.value?.user_id || post.value?.seller_id
  return Boolean(currentUser.value?.id && ownerId && currentUser.value.id === ownerId)
})

const isEditAllowed = computed(() => purchaseRequests.value.length === 0)

const isBuyButtonDisabled = computed(() => {
  if (isOwner.value) return false
  if (!currentUser.value) return true
  return post.value?.status === 'sold'
})

const buyButtonText = computed(() => {
  if (isOwner.value) return 'Manage Listing'
  if (post.value?.status === 'sold') return 'Sold'
  return 'Request to Buy'
})

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
  if (!post.value || !isOwner.value || !currentUser.value) {
    console.log('[MarketDetail] Skipping purchase requests fetch:', {
      hasPost: Boolean(post.value),
      isOwner: isOwner.value,
      hasUser: Boolean(currentUser.value)
    })
    purchaseRequests.value = []
    return
  }

  isLoadingRequests.value = true
  try {
    const postId = post.value.id
    console.log('[MarketDetail] Fetching purchase requests for post_id:', postId)

    // Step 1: Fetch raw requests for this post
    const { data: requests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('[MarketDetail] Error fetching purchase requests:', requestsError)
      throw requestsError
    }

    console.log('[MarketDetail] Raw purchase requests retrieved:', requests)

    if (!requests || requests.length === 0) {
      purchaseRequests.value = []
      return
    }

    // Step 2: Extract unique buyer IDs
    const buyerIds = [...new Set(requests.map((request: any) => request.buyer_id).filter(Boolean))]
    let profileMap = new Map<string, any>()

    if (buyerIds.length > 0) {
      // Query profiles matching your schema (joining profile_data for Avatar)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          profile_data ( Avatar )
        `)
        .in('id', buyerIds)

      if (profilesError) {
        console.warn('[MarketDetail] Warning fetching profiles, using fallback IDs:', profilesError)
      } else if (profiles) {
        profileMap = new Map(
          profiles.map((profile: any) => {
            const pData = getProfileRecord(profile.profile_data)
            return [
              profile.id,
              {
                id: profile.id,
                full_name: profile.full_name,
                avatar_url: pData?.Avatar || null
              }
            ]
          })
        )
      }
    }

    // Step 3: Attach mapped profiles to requests
    purchaseRequests.value = requests.map((request: any) => ({
      ...request,
      buyer: request.buyer_id ? profileMap.get(request.buyer_id) || null : null
    })) as PurchaseRequest[]

    console.log('[MarketDetail] Final purchase requests ready for UI:', purchaseRequests.value)
  } catch (err) {
    console.error('[MarketDetail] Failed to load purchase requests:', err)
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
  authLoading.value = true
  error.value = null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser.value = session?.user ? { id: session.user.id } : null
    await fetchPostDetails()

    if (post.value) {
      await Promise.all([fetchPurchaseRequests(), fetchComments()])
      if (route.query.request === 'true' && !isOwner.value) {
        handleBuyOrRequest()
      }
    }
  } catch (err: any) {
    console.error('Failed to load marketplace details:', err)
    error.value = err.message || 'Failed to load marketplace listing.'
  } finally {
    authLoading.value = false
    isLoading.value = false
  }
}


async function updateListingStatus(status: 'sold' | 'available' | 'reserved' | 'cancelled') {
  if (!isOwner.value || !post.value || isUpdatingListing.value) return

  isUpdatingListing.value = true
  try {
    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update({ status })
      .eq('id', post.value.id)

    if (updateError) throw updateError

    post.value.status = status
    showManageModal.value = false
  } catch (err: any) {
    console.error('Failed to update marketplace listing status:', err)
    alert('Failed to update listing: ' + (err.message || 'Unknown error'))
  } finally {
    isUpdatingListing.value = false
  }
}

async function handleEditListing(payload: any) {
  if (!isOwner.value || !post.value || isUpdatingListing.value) return

  isUpdatingListing.value = true
  try {
    const hasRequests = purchaseRequests.value.length > 0
    const updates = hasRequests
      ? { description: payload.description }
      : {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          pricing_type: payload.pricing_type,
          pricing_structure: payload.pricing_structure,
          price: payload.price,
          quantity: payload.quantity,
          quantity_unit: payload.quantity_unit
        }

    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', post.value.id)

    if (updateError) throw updateError

    post.value = { ...post.value, ...updates }
    showEditModal.value = false
    showManageModal.value = false
  } catch (err: any) {
    console.error('Failed to update marketplace listing:', err)
    alert('Failed to update listing: ' + (err.message || 'Unknown error'))
  } finally {
    isUpdatingListing.value = false
  }
}

async function handleBuyOrRequest() {
  if (!currentUser.value || isOwner.value || !post.value || post.value.status === 'sold') return
  selectedMaterial.value = materialOptions.value[0]?.name || post.value.title
  requestedQuantity.value = 1
  showRequestModal.value = true
}

async function handleRequestSubmit() {
  await fetchPurchaseRequests()
}

async function handleAcceptRequest() {
  if (!selectedRequest.value || !post.value) return

  isUpdatingRequest.value = true
  try {
    const requestId = selectedRequest.value.id
    const postId = post.value.id

    const { error: reqError } = await supabase
      .from('purchase_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (reqError) throw reqError

    const { error: postError } = await supabase
      .from('marketplace_listings')
      .update({ status: 'sold' })
      .eq('id', postId)

    if (postError) {
      console.warn('Could not update listing status to sold:', postError)
    } else {
      post.value.status = 'sold'
    }

    await fetchPurchaseRequests()
    selectedRequest.value = null
  } catch (err: any) {
    console.error('Failed to accept purchase request:', err)
    alert('Failed to accept request: ' + (err.message || 'Unknown error'))
  } finally {
    isUpdatingRequest.value = false
  }
}

async function handleRejectRequest() {
  if (!selectedRequest.value || selectedRequest.value.status !== 'pending') return

  isUpdatingRequest.value = true
  try {
    const { error: requestError } = await supabase
      .from('purchase_requests')
      .update({ status: 'rejected' })
      .eq('id', selectedRequest.value.id)

    if (requestError) throw requestError

    await fetchPurchaseRequests()
    selectedRequest.value = null
  } catch (err: any) {
    console.error('Failed to reject purchase request:', err)
    alert('Failed to reject request: ' + (err.message || 'Unknown error'))
  } finally {
    isUpdatingRequest.value = false
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

const materialOptions = computed(() => {
  const source = post.value?.materials || post.value?.material_type
  const materials = Array.isArray(source) ? source : source ? [source] : []
  return materials.map((material: any) => ({
    name: material.name || material.material || material.material_name || post.value?.title,
    quantity: material.quantity ?? material.target,
    unit: material.unit
  }))
})
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
          <button
            class="buy-button"
            :class="{ 'buy-button-disabled': post.status === 'sold' && !isOwner }"
            type="button"
            :disabled="isBuyButtonDisabled"
            @click="isOwner ? (showManageModal = true) : handleBuyOrRequest()"
          >
            {{ buyButtonText }}
        </button>
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

      <section v-if="isOwner && !authLoading" class="detail-card purchase-requests">
        <div class="section-header">
          <h2>Purchase Requests</h2>
          <p>Review requests from community members.</p>
        </div>

        <p v-if="isLoadingRequests" class="muted-text">Loading requests...</p>
        <p v-else-if="purchaseRequests.length === 0" class="muted-text">No purchase requests yet.</p>
        <button
          v-for="request in purchaseRequests"
          :key="request.id"
          class="request-card"
          type="button"
          @click="selectedRequest = request"
        >
          <img
            :src="request.buyer?.avatar_url || 'https://placehold.co/44x44'"
            alt="Buyer avatar"
            class="request-avatar"
          />
          <span class="request-info">
            <strong>{{ request.buyer?.full_name || request.buyer?.username || `Buyer ${request.buyer_id?.slice(0, 8) || 'Unknown'}` }}</strong>
            <small>{{ request.created_at ? new Date(request.created_at).toLocaleString() : request.status || 'Pending' }}</small>
            <small v-if="request.quantity !== null && request.quantity !== undefined">Quantity: {{ request.quantity }}</small>
            <small v-if="request.notes">{{ request.notes }}</small>
            <span v-if="request.status" class="status-tag">{{ request.status }}</span>
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

  <BuyRequestModal
    v-model="showRequestModal"
    :post="post"
    @submit="handleRequestSubmit"
  />

  <CreateMarketplaceModal
    v-model="showEditModal"
    :initial-listing="post"
    :has-purchase-requests="!isEditAllowed"
    @publish="handleEditListing"
  />

  <Teleport to="body">
    <div v-if="showManageModal && isOwner" class="modal-overlay" @click.self="showManageModal = false">
      <div class="request-modal manage-listing-modal" role="dialog" aria-modal="true" aria-labelledby="manage-listing-title">
        <div class="modal-header">
          <h2 id="manage-listing-title">Manage Listing</h2>
          <button class="modal-close" type="button" aria-label="Close" @click="showManageModal = false">×</button>
        </div>
        <div class="modal-body manage-listing-actions">
          <p class="muted-text">Current status: <strong>{{ post?.status || 'available' }}</strong></p>
          <button type="button" class="btn-secondary" :disabled="isUpdatingListing" @click="updateListingStatus('available')">Mark Available</button>
          <button type="button" class="btn-secondary" :disabled="isUpdatingListing" @click="updateListingStatus('reserved')">Mark Reserved</button>
          <button type="button" class="btn-secondary" :disabled="isUpdatingListing" @click="updateListingStatus('sold')">Mark Sold</button>
          <button type="button" class="btn-primary" @click="showEditModal = true">Edit Details</button>
          <button type="button" class="btn-danger" :disabled="isUpdatingListing" @click="updateListingStatus('cancelled')">Cancel Listing</button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
      <div class="request-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>Purchase Request Details</h2>
          <button class="modal-close" type="button" @click="selectedRequest = null">×</button>
        </div>

        <div class="modal-body">
          <!-- Buyer Header -->
          <div class="buyer-profile-header">
            <img
              :src="selectedRequest.buyer?.avatar_url || 'https://placehold.co/48x48'"
              alt="Buyer avatar"
              class="modal-avatar"
            />
            <div>
              <h3>{{ selectedRequest.buyer?.full_name || selectedRequest.buyer?.username || 'Unknown User' }}</h3>
              <span class="status-badge" :class="selectedRequest.status || 'pending'">
                {{ selectedRequest.status || 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Request Summary Grid -->
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Item / Material</span>
              <span class="detail-value">{{ selectedRequest.material_name || post?.title }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Quantity Requested</span>
              <span class="detail-value">{{ selectedRequest.quantity ?? '1' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date Requested</span>
              <span class="detail-value">
                {{ selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'Recently' }}
              </span>
            </div>
          </div>

          <!-- Buyer Notes -->
          <div v-if="selectedRequest.notes" class="buyer-notes-box">
            <strong>Note from Buyer:</strong>
            <p>"{{ selectedRequest.notes }}"</p>
          </div>
        </div>

        <!-- Modal Footer / Actions -->
        <div class="modal-footer">
          <button
            class="btn-secondary"
            type="button"
            :disabled="isUpdatingRequest"
            @click="selectedRequest = null"
          >
            Close
          </button>

          <template v-if="selectedRequest.status === 'pending' && post?.status !== 'sold'">
            <button
              class="btn-secondary"
              type="button"
              :disabled="isUpdatingRequest"
              @click="handleRejectRequest"
            >
              {{ isUpdatingRequest ? 'Updating...' : 'Reject Request' }}
            </button>
            <button
              class="btn-primary"
              type="button"
              :disabled="isUpdatingRequest"
              @click="handleAcceptRequest"
            >
              {{ isUpdatingRequest ? 'Accepting...' : 'Accept Request' }}
            </button>
          </template>
          <span v-else-if="selectedRequest.status === 'accepted'" class="accepted-text">
            ✓ Request Accepted (Listing Sold)
          </span>
          <span v-else-if="selectedRequest.status === 'rejected'" class="rejected-text">
            Request Rejected
          </span>
          <span v-else-if="post?.status === 'sold'" class="accepted-text">
            Listing Sold
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Core Page & Listing Card Styles */
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

/* Request List Items */
.request-card { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e4e7e3; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; margin-top: 8px; }
.request-card:hover { border-color: #778732; background: #f7f8f6; }
.request-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.request-info { display: flex; flex-direction: column; gap: 4px; }
.request-info small { color: #8f9a8f; }

/* Page States */
.state-card { max-width: 600px; margin: 80px auto; padding: 32px; text-align: center; color: #666; }
.state-card.error { color: #d32f2f; }
.back-link { color: #2e7d32; font-weight: 600; }

/* Modal Overlay & Card Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.request-modal {
  position: relative;
  width: min(480px, 100%);
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e4e7e3;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7e3;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1d1a;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 24px;
  color: #8f9a8f;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: #1a1d1a;
}

/* Buyer Avatar & Badge */
.buyer-profile-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.modal-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e4e7e3;
}

.buyer-profile-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #1a1d1a;
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f0f2ee;
  color: #778732;
}

.status-badge.accepted {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Details Box */
.details-grid {
  display: grid;
  gap: 10px;
  background: #f7f8f6;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: #8f9a8f;
}

.detail-value {
  font-weight: 600;
  color: #1a1d1a;
}

.buyer-notes-box {
  background: #fff9e6;
  border: 1px solid #ffe0b2;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #5d4037;
}

.buyer-notes-box p {
  margin: 4px 0 0;
  font-style: italic;
}

/* Modal Actions Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7e3;
}

.btn-primary {
  border: none;
  border-radius: 8px;
  background: #778732;
  color: #ffffff;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #637227;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  background: #ffffff;
  color: #525a52;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background: #f7f8f6;
}

.manage-listing-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manage-listing-actions .muted-text {
  margin: 0 0 4px;
}

.btn-danger {
  border: 1px solid #efcaca;
  border-radius: 8px;
  background: #fff1f1;
  color: #b42318;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #ffe2e2;
}

.btn-danger:disabled,
.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accepted-text {
  font-size: 13px;
  font-weight: 700;
  color: #2e7d32;
}

.rejected-text {
  font-size: 13px;
  font-weight: 700;
  color: #c62828;
}

@media (max-width: 600px) {
  .listing-header { flex-direction: column; }
  .buy-button { width: 100%; }
}
</style>
