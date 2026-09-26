<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Share2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { supabase } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// --- Vite Leaflet Icon Fix ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})
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
    email?: string
    contact_number?: string
    address?: string
    latitude?: number
    longitude?: number
    score?: number
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
const currentImageIndex = ref(0)
const showShareToast = ref(false)
const isUpdatingListing = ref(false)
const isLoading = ref(true)
const isSubmittingComment = ref(false)
const isLoadingRequests = ref(false)
const isUpdatingRequest = ref(false)
const { addToast } = useToast()

const mapContainer = ref<HTMLElement | null>(null)
let requestMapInstance: L.Map | null = null

watch(selectedRequest, async (newReq) => {
  if (!newReq) {
    if (requestMapInstance) {
      requestMapInstance.remove()
      requestMapInstance = null
    }
    return
  }
  
  if (newReq.buyer && newReq.buyer.latitude && newReq.buyer.longitude) {
    await nextTick()
    setTimeout(() => {
      if (!mapContainer.value) return
      if (requestMapInstance) {
        requestMapInstance.remove()
      }
      const lat = newReq.buyer?.latitude as number
      const lng = newReq.buyer?.longitude as number
      requestMapInstance = L.map(mapContainer.value).setView([lat, lng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(requestMapInstance)
      L.marker([lat, lng]).addTo(requestMapInstance)
    }, 100)
  }
})
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
      images:marketplace_listing_images (
        id,
        image_url,
        display_order
      ),
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
          email,
          contact_number,
          address,
          latitude,
          longitude,
          profile_data ( Avatar, "CommunityScore" )
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
                email: profile.email,
                contact_number: profile.contact_number,
                address: profile.address,
                latitude: profile.latitude,
                longitude: profile.longitude,
                avatar_url: pData?.Avatar || null,
                score: pData?.CommunityScore || 0
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
    const updates: any = hasRequests
      ? { description: payload.description }
      : {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          pricing_type: payload.pricingType,
          pricing_structure: payload.pricingStructure,
          price: payload.price,
          quantity: payload.quantity,
          quantity_unit: payload.quantityUnit,
          location_address: payload.location_address,
          latitude: payload.latitude,
          longitude: payload.longitude
        }

    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', post.value.id)

    if (updateError) throw updateError

    // Handle new images if uploaded
    const retainedUrls = payload.retained_images ? payload.retained_images.map((img: any) => img.image_url) : []
    const newImageUrls: string[] = []

    if (payload.images && payload.images.length > 0) {
      for (const file of payload.images) {
        const filePath = `marketplace/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file)
        if (!uploadError) {
          const { data } = supabase.storage.from('images').getPublicUrl(filePath)
          newImageUrls.push(data.publicUrl)
        }
      }
    }

    const finalUrls = [...retainedUrls, ...newImageUrls]

    // Always delete old image records
    await supabase.from('marketplace_listing_images').delete().eq('listing_id', post.value.id)

    // Insert final combined image records
    if (finalUrls.length > 0) {
      const imageRecords = finalUrls.map((url, idx) => ({
        listing_id: post.value.id,
        image_url: url,
        display_order: idx
      }))
      await supabase.from('marketplace_listing_images').insert(imageRecords)
    }

    // Refresh everything
    await fetchPostDetails()

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
    addToast('Request accepted successfully!', 'success')
    selectedRequest.value = null
  } catch (err: any) {
    console.error('Failed to accept purchase request:', err)
    addToast('Failed to accept request', 'error')
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
    addToast('Request accepted successfully!', 'success')
    selectedRequest.value = null
  } catch (err: any) {
    console.error('Failed to reject purchase request:', err)
    addToast('Failed to reject request', 'error')
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

function nextImage() {
  if (post.value?.images && currentImageIndex.value < post.value.images.length - 1) {
    currentImageIndex.value++
  }
}

function prevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

async function handleShare() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    showShareToast.value = true
    setTimeout(() => { showShareToast.value = false }, 2500)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
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
          <div class="action-buttons">
            <button
              class="buy-button"
              :class="{ 'buy-button-disabled': post.status === 'sold' && !isOwner }"
              type="button"
              :disabled="isBuyButtonDisabled"
              @click="isOwner ? (showManageModal = true) : handleBuyOrRequest()"
            >
              {{ buyButtonText }}
            </button>
            <button class="share-button-icon" @click="handleShare" aria-label="Share listing">
              <Share2 :size="18" />
            </button>
          </div>
        </div>

        <!-- Share Toast -->
        <div v-if="showShareToast" class="share-toast">
          Link Copied to Clipboard
        </div>

        <div v-if="post.images?.length" class="carousel-container">
          <div class="carousel-inner">
            <img
              :src="post.images[currentImageIndex].image_url || post.images[currentImageIndex]"
              :alt="post.title"
              class="carousel-image"
            />

            <!-- Controls -->
            <button
              v-if="post.images.length > 1 && currentImageIndex > 0"
              class="carousel-btn prev"
              @click="prevImage"
            >
              <ChevronLeft :size="24" />
            </button>
            <button
              v-if="post.images.length > 1 && currentImageIndex < post.images.length - 1"
              class="carousel-btn next"
              @click="nextImage"
            >
              <ChevronRight :size="24" />
            </button>
          </div>

          <!-- Indicators -->
          <div v-if="post.images.length > 1" class="carousel-indicators">
            <span
              v-for="(_, idx) in post.images"
              :key="idx"
              class="dot"
              :class="{ active: currentImageIndex === Number(idx) }"
              @click="currentImageIndex = Number(idx)"></span>
          </div>
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
              <div class="user-name-row">
                <h3>{{ selectedRequest.buyer?.full_name || selectedRequest.buyer?.username || 'Unknown User' }}</h3>
                <div class="user-rating" v-if="selectedRequest.buyer?.score !== undefined">
                  ⭐ {{ selectedRequest.buyer.score.toFixed(1) }}
                </div>
              </div>
              <span class="status-badge" :class="selectedRequest.status || 'pending'">
                {{ selectedRequest.status || 'Pending' }}
              </span>
            </div>
          </div>
          
          <!-- Contact Info -->
          <div class="contact-info-box" v-if="selectedRequest.buyer?.email || selectedRequest.buyer?.contact_number">
            <h4>Contact Buyer</h4>
            <p v-if="selectedRequest.buyer.email"><strong>Email:</strong> {{ selectedRequest.buyer.email }}</p>
            <p v-if="selectedRequest.buyer.contact_number"><strong>Phone:</strong> {{ selectedRequest.buyer.contact_number }}</p>
          </div>
          
          <!-- Map & Location -->
          <div class="location-box" v-if="selectedRequest.buyer?.address || selectedRequest.buyer?.latitude">
            <h4>Buyer's Location</h4>
            <p v-if="selectedRequest.buyer.address" class="address-text">{{ selectedRequest.buyer.address }}</p>
            <div v-if="selectedRequest.buyer.latitude && selectedRequest.buyer.longitude" ref="mapContainer" class="modal-map"></div>
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
.action-buttons { display: flex; align-items: center; gap: 8px; }
.buy-button { flex-shrink: 0; border: none; border-radius: 8px; background: #778732; color: #fff; padding: 11px 16px; font-weight: 700; cursor: pointer; }
.share-button-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: 1px solid #e4e7e3; border-radius: 8px; background: #fff; color: #525a52; cursor: pointer; transition: all 0.2s ease; }
.share-button-icon:hover { background: #f0f4ea; border-color: #778732; color: #778732; }

/* Share Toast */
.share-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a1d1a; color: #fff; padding: 10px 20px; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); animation: fadeInOut 2.5s ease-in-out forwards; }
@keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, 20px); } 15% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }

/* Carousel */
.carousel-container { position: relative; margin: 18px 0; display: flex; flex-direction: column; gap: 12px; }
.carousel-inner { position: relative; width: 100%; height: 350px; border-radius: 12px; overflow: hidden; background: #f7f8f6; }
.carousel-image { width: 100%; height: 100%; object-fit: contain; }
.carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255, 255, 255, 0.8); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1a1d1a; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: background 0.2s; }
.carousel-btn:hover { background: #fff; }
.carousel-btn.prev { left: 12px; }
.carousel-btn.next { right: 12px; }
.carousel-indicators { display: flex; justify-content: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #d9ded7; cursor: pointer; transition: background 0.2s; }
.dot.active { background: #778732; }

.listing-description { white-space: pre-wrap; line-height: 1.6; color: #3f463f; }
.listing-details { display: grid; gap: 8px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e4e7e3; color: #525a52; }
.section-header h2 { margin: 0 0 4px; color: #1a1d1a; }
.section-header p { margin: 0 0 16px; color: #8f9a8f; font-size: 13px; }

/* Request List Items */
.request-card { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e4e7e3; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; margin-top: 8px; }
.request-card:hover { border-color: #778732; background: #f7f8f6; }
.request-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.user-name-row { display: flex; align-items: center; gap: 8px; }
.user-rating { background: #fdf5e6; color: #b8860b; font-size: 11px; padding: 2px 6px; border-radius: 12px; font-weight: bold; }
.contact-info-box, .location-box { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #eee; }
.contact-info-box h4, .location-box h4 { margin: 0 0 8px; font-size: 14px; color: #1a1d1a; }
.contact-info-box p, .location-box p { margin: 4px 0; font-size: 13px; color: #444; }
.address-text { font-style: italic; color: #666; margin-bottom: 8px !important; }
.modal-map { width: 100%; height: 200px; border-radius: 6px; background: #eaebec; }

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
