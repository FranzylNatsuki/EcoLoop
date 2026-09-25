<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { supabase } from '../composables/useAuth'
import PostCard from '../components/posts/PostCard.vue'

// import SavedProjectsCard from '../components/sidebar/SavedProjectsCard.vue'
import EditProfileModal from '../components/Modals/EditProfileModal.vue'
import { usePosts } from '../composables/usePosts'
import BackButton from '../components/common/BackButton.vue'
import DonationCard from '../components/posts/DonationCard.vue'
import { BadgeCheck } from 'lucide-vue-next'

const router = useRouter()

const activeTab = ref('posts')
const profileData = ref<any>(null)
const isLoading = ref(true)
const isEditModalOpen = ref(false)
const userPledges = ref<any[]>([])
const userListings = ref<any[]>([])
const userRequests = ref<any[]>([])
const isLoadingUserRequests = ref(false)
const hasLoadedUserRequests = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const sortBy = ref('newest')
const requestSearchQuery = ref('')
const requestStatusFilter = ref('all')
const requestCategoryFilter = ref('all')
const requestSortBy = ref('newest_requested')

// Extract posts state and fetch method from composable
const { posts } = usePosts()

async function fetchUserRequests() {
  if (isLoadingUserRequests.value) return

  isLoadingUserRequests.value = true
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user?.id) {
      userRequests.value = []
      hasLoadedUserRequests.value = true
      return
    }

    const buyerId = user.id
    console.log('[ProfileView] Fetching requests for buyer_id:', buyerId)

    const { data: requests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })

    if (requestsError) throw requestsError

    if (!requests || requests.length === 0) {
      userRequests.value = []
      hasLoadedUserRequests.value = true
      return
    }

    const postIds = [...new Set(requests.map((request: any) => request.post_id).filter(Boolean))]
    const sellerIds = [...new Set(requests.map((request: any) => request.seller_id).filter(Boolean))]
    let listingsMap = new Map<any, any>()
    let sellersMap = new Map<any, any>()

    if (postIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select('id, title, price, pricing_type, status')
        .in('id', postIds)

      if (listingsError) {
        console.error('[ProfileView] Failed to fetch requested listings:', listingsError)
      } else if (listings) {
        listingsMap = new Map(listings.map((listing: any) => [String(listing.id), listing]))
      }
    }

    if (sellerIds.length > 0) {
      const { data: sellers, error: sellersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', sellerIds)

      if (sellersError) {
        console.error('[ProfileView] Failed to fetch request sellers:', sellersError)
      } else if (sellers) {
        sellersMap = new Map(sellers.map((seller: any) => [String(seller.id), seller]))
      }
    }

    userRequests.value = requests.map((request: any) => ({
      ...request,
      listing: request.post_id ? listingsMap.get(String(request.post_id)) || null : null,
      seller: request.seller_id ? sellersMap.get(String(request.seller_id)) || null : null
    }))
    hasLoadedUserRequests.value = true
    console.log('[ProfileView] Successfully loaded user requests:', userRequests.value)
  } catch (error) {
    console.error('[ProfileView] Failed to fetch purchase requests:', error)
    userRequests.value = []
  } finally {
    isLoadingUserRequests.value = false
  }
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  if (tab === 'requests' && !hasLoadedUserRequests.value) {
    void fetchUserRequests()
  }
}

function goToListing(postId: string | number | null | undefined) {
  if (postId) {
    void router.push(`/marketplace/${postId}`)
  }
}

function goToListingDetail(listingId: string | number | null | undefined) {
  if (listingId) {
    void router.push(`/marketplace/${listingId}`)
  }
}

// Fetch posts on view mount
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const userId = session.user.id

    console.log("Session found! Fetching data for:", userId)

    // Fetch from your profiles, profile_data, and organizations tables
    const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            profile_data (*),
            organizations!organization_id (*)
          `)
          .eq('id', userId)
          .single()

    const { data: pledgesData, error: pledgesError } = await supabase
      .from('pledges')
      .select(`
        *,
        post:cause_requests(title),
        items:pledge_items(material_name, quantity, unit)
      `)
      .eq('donor_id', userId)
      .order('created_at', { ascending: false })

    if (!pledgesError && pledgesData) {
      userPledges.value = pledgesData
    }

    const { data: listingsData, error: listingsError } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('author_id', userId)
          .order('created_at', { ascending: false })

    if (listingsError) {
      console.error('Failed to fetch user marketplace listings:', listingsError)
    } else if (listingsData) {
      const listingIds = listingsData.map((listing: any) => listing.id)
      let requestCounts = new Map<string, number>()

      if (listingIds.length > 0) {
        const { data: requests, error: requestsError } = await supabase
          .from('purchase_requests')
          .select('post_id')
          .in('post_id', listingIds)

        if (requestsError) {
          console.error('Failed to fetch marketplace request counts:', requestsError)
        } else {
          requestCounts = (requests || []).reduce((counts: Map<string, number>, request: any) => {
            const key = String(request.post_id)
            counts.set(key, (counts.get(key) || 0) + 1)
            return counts
          }, new Map<string, number>())
        }
      }

      userListings.value = listingsData.map((listing: any) => ({
        ...listing,
        request_count: requestCounts.get(String(listing.id)) || 0
      }))
    }

    // 3. Log any database errors (like RLS or empty tables)
    if (error) {
      console.error("Database Error:", error.message)
    }

    if (data) {
      console.log("Success! Profile Data:", data)
      profileData.value = data
    }
  } else {
    console.warn("No session found at all.")
  }

  isLoading.value = false
})


// The function that runs when the modal emits 'save'
const handleSaveProfile = async (updatedData: any) => {
  console.log("SAVE BUTTON CLICKED! Data received:", updatedData)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
      console.error("No session found during save! Are you logged out?")
      return
  }

  const userId = session.user.id
  let finalAvatarUrl = updatedData.avatarPreview

  // 1. Upload new avatar if one was selected
  if (updatedData.avatarFile) {
    const fileExt = updatedData.avatarFile.name.split('.').pop()
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, updatedData.avatarFile, { upsert: true })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError.message)
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      finalAvatarUrl = data.publicUrl
    }
  }

  // 2. Update profiles table
  const { error: profileError } = await supabase.from('profiles')
    .update({
      full_name: updatedData.fullName,
      location: updatedData.location,
      contact_number: updatedData.contact,
      latitude: updatedData.latitude,
      longitude: updatedData.longitude
    })
    .eq('id', userId)

  if (profileError) console.error("Profile Update Error:", profileError.message)

  // 3. Update profile_data table
  const { error: dataError } = await supabase.from('profile_data')
    .update({
      about: updatedData.about,
      Avatar: finalAvatarUrl
    })
    .eq('id', userId)

  if (dataError) console.error("Profile Data Update Error:", dataError.message)

  // 4. Safely update the UI instantly
  if (!profileError && !dataError && profileData.value) {
    profileData.value.full_name = updatedData.fullName
    profileData.value.location = updatedData.location
    profileData.value.contact_number = updatedData.contact

    // Safety check: Create the nested object if it doesn't exist yet!
    if (!profileData.value.profile_data) {
      profileData.value.profile_data = {}
    }

    profileData.value.profile_data.about = updatedData.about
    profileData.value.profile_data.Avatar = finalAvatarUrl
  }
}

// Filter posts matching the logged-in user's database name
const userPosts = computed(() => {
  if (!posts.value || !Array.isArray(posts.value) || !profileData.value) return []
  return posts.value.filter(post => post.author?.full_name === profileData.value.full_name)
})

const listingCategories = computed(() => [
  'all',
  ...new Set(userListings.value.map((listing: any) => listing.category).filter(Boolean))
])

const filteredListings = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filtered = userListings.value.filter((listing: any) => {
    const matchesSearch = !query
      || `${listing.title || ''} ${listing.description || ''}`.toLowerCase().includes(query)
    const matchesStatus = statusFilter.value === 'all'
      || String(listing.status || '').toLowerCase() === statusFilter.value
    const matchesCategory = categoryFilter.value === 'all'
      || listing.category === categoryFilter.value
    return matchesSearch && matchesStatus && matchesCategory
  })

  return filtered.sort((a: any, b: any) => {
    if (sortBy.value === 'requests_high') return (b.request_count || 0) - (a.request_count || 0)
    if (sortBy.value === 'requests_low') return (a.request_count || 0) - (b.request_count || 0)

    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return sortBy.value === 'oldest' ? dateA - dateB : dateB - dateA
  })
})

const listingStats = computed(() => ({
  total: userListings.value.length,
  available: userListings.value.filter((listing: any) => String(listing.status || '').toLowerCase() === 'available').length,
  sold: userListings.value.filter((listing: any) => String(listing.status || '').toLowerCase() === 'sold').length
}))

const filteredRequests = computed(() => {
  const query = requestSearchQuery.value.trim().toLowerCase()
  const filtered = userRequests.value.filter((request: any) => {
    const matchesSearch = !query || `${request.listing?.title || ''} ${request.seller?.full_name || ''}`
      .toLowerCase()
      .includes(query)
    const matchesStatus = requestStatusFilter.value === 'all'
      || String(request.status || '').toLowerCase() === requestStatusFilter.value
    const matchesCategory = requestCategoryFilter.value === 'all'
      || String(request.listing?.category || '').toLowerCase() === requestCategoryFilter.value.toLowerCase()
    return matchesSearch && matchesStatus && matchesCategory
  })

  return filtered.sort((a: any, b: any) => {
    if (requestSortBy.value === 'qty_high') {
      return Number(b.quantity ?? b.requested_quantity ?? 0) - Number(a.quantity ?? a.requested_quantity ?? 0)
    }
    if (requestSortBy.value === 'qty_low') {
      return Number(a.quantity ?? a.requested_quantity ?? 0) - Number(b.quantity ?? b.requested_quantity ?? 0)
    }

    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return requestSortBy.value === 'oldest_requested' ? dateA - dateB : dateB - dateA
  })
})

const requestStats = computed(() => ({
  total: userRequests.value.length,
  pending: userRequests.value.filter((request: any) => String(request.status || '').toLowerCase() === 'pending').length,
  accepted: userRequests.value.filter((request: any) => String(request.status || '').toLowerCase() === 'accepted').length,
  rejected: userRequests.value.filter((request: any) => String(request.status || '').toLowerCase() === 'rejected').length
}))

</script>

<template>
  <div class="profile-page">
    <header class="profile-header-container">
      <img
        class="profile-banner"
        src="../assets/profile-banner.png"
        alt="User Profile Banner"
      />

      <div class="profile-info-block" v-if="!isLoading && profileData">
        <div class="avatar-overlap-wrapper">
          <img
            class="avatar-ring"
            :src="profileData.profile_data?.Avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
            alt="Avatar"
            style="object-fit: cover;"
          />
        </div>
        <div class="avatar-placeholder-spacer"></div>

        <div class="user-meta-main">
          <div class="name-row">
            <div class="names">
              <h1 class="user-display-name">
                {{ profileData.full_name }}
                <BadgeCheck
                  v-if="profileData.is_org && profileData.organizations?.verification_status === 'verified'"
                  fill="#3B82F6"
                  color="white"
                  :size="24"
                  class="verified-badge"
                />
              </h1>
              <span class="user-subtext">{{ profileData.email }} • Joined {{ new Date(profileData.created_at).getFullYear() }}</span>
            </div>
            <button class="btn-edit-profile" @click="isEditModalOpen = true">
              Edit Profile
            </button>
          </div>
          <p class="user-bio">
            {{ profileData.profile_data?.about || 'No bio provided yet.' }}
          </p>
        </div>
      </div>

      <div class="profile-info-block" v-else>
        <div class="avatar-placeholder-spacer"></div>
        <div class="user-meta-main">
          <p>Loading profile...</p>
        </div>
      </div>

      <div class="profile-stats-wrapper" v-if="!isLoading && profileData">
        <div class="profile-stats-inner">
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.ItemsDonated || 0 }}</span>
            <span class="stat-label">Items Donated</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.ProjectsSupported || 0 }}</span>
            <span class="stat-label">Projects Supported</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.CommunityScore || 0 }}/5</span>
            <span class="stat-label">Community Score</span>
          </div>
        </div>
      </div>
      <div class="profile-stats-wrapper" v-else></div>

      <nav class="profile-tabs" aria-label="Profile section tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'posts' }"
          @click="setActiveTab('posts')"
        >
          Posts
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'donations' }"
          @click="setActiveTab('donations')"
        >
          Donations
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'listings' }"
          @click="setActiveTab('listings')"
        >
          Listings
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'requests' }"
          @click="setActiveTab('requests')"
        >
          Requests
        </button>

        <button
          class="tab-btn"
          :class="{ active: activeTab === 'saved' }"
          @click="setActiveTab('saved')"
        >
          Saved Projects
        </button>

        <!--
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button> -->

      </nav>
    </header>

    <div class="main-layout-wrapper">
      <section class="left-feed-column">
        <BackButton />
        <template v-if="activeTab === 'posts'">
          <PostCard
            v-for="post in userPosts"
            :key="post.id"
            :post="post"
          />
        </template>

        <template v-else-if="activeTab === 'donations'">
          <div v-if="userPledges.length === 0" class="empty-state">No completed donations yet.</div>
          <DonationCard
            v-for="pledge in userPledges"
            :key="pledge.id"
            :pledge="pledge"
          />
        </template>

        <template v-else-if="activeTab === 'listings'">
          <div class="listings-filter-bar">
            <input
              v-model="searchQuery"
              class="listing-filter-control listing-search"
              type="search"
              placeholder="Search listing title or details..."
              aria-label="Search listings"
            />
            <select v-model="statusFilter" class="listing-filter-control" aria-label="Filter by status">
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
            <select v-model="categoryFilter" class="listing-filter-control" aria-label="Filter by category">
              <option v-for="category in listingCategories" :key="category" :value="category">
                {{ category === 'all' ? 'All Categories' : category }}
              </option>
            </select>
            <select v-model="sortBy" class="listing-filter-control" aria-label="Sort listings">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="requests_high">Most Purchase Requests</option>
              <option value="requests_low">Least Purchase Requests</option>
            </select>
          </div>
          <p class="filter-summary-line">
            Showing {{ filteredListings.length }} of {{ listingStats.total }} listings
            ({{ listingStats.available }} available, {{ listingStats.sold }} sold)
          </p>

          <div v-if="userListings.length === 0" class="empty-state">
            No marketplace listings found.
          </div>
          <div v-else-if="filteredListings.length === 0" class="empty-state">
            No listings match your filters. Try adjusting your search or filters.
          </div>
          <div v-else class="listings-grid">
            <article v-for="item in filteredListings" :key="item.id" class="profile-listing-card">
              <div class="card-top-row">
                <div>
                  <h3 class="item-title">{{ item.title || 'Untitled listing' }}</h3>
                  <span class="item-category">{{ item.category || 'Uncategorized' }}</span>
                </div>
                <span class="status-badge" :class="String(item.status || 'available').toLowerCase()">
                  {{ item.status || 'Available' }}
                </span>
              </div>
              <p class="item-description">{{ item.description || 'No description provided.' }}</p>
              <div class="listing-meta-row">
                <span><strong>Price:</strong> {{ item.price ?? 'Not specified' }}</span>
                <span><strong>Quantity:</strong> {{ item.quantity ?? 'Not specified' }}</span>
              </div>
              <div class="listing-card-footer">
                <span class="leads-badge">
                  {{ item.request_count ? `${item.request_count} Requests` : 'No Requests Yet' }}
                </span>
                <button
                  class="manage-requests-link"
                  type="button"
                  @click.stop="goToListingDetail(item.id)"
                >
                  Manage Requests <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          </div>
        </template>

        <template v-else-if="activeTab === 'requests'">
          <div class="requests-filter-bar">
            <input
              v-model="requestSearchQuery"
              class="listing-filter-control listing-search"
              type="search"
              placeholder="Search request item or seller..."
              aria-label="Search purchase requests"
            />
            <select v-model="requestStatusFilter" class="listing-filter-control" aria-label="Filter requests by status">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select v-model="requestCategoryFilter" class="listing-filter-control" aria-label="Filter requests by category">
              <option value="all">All Categories</option>
              <option value="Plastics">Plastics</option>
              <option value="Paper">Paper</option>
              <option value="Metal">Metal</option>
              <option value="Glass">Glass</option>
              <option value="Other">Other</option>
            </select>
            <select v-model="requestSortBy" class="listing-filter-control" aria-label="Sort purchase requests">
              <option value="newest_requested">Newest Requested</option>
              <option value="oldest_requested">Oldest Requested</option>
              <option value="qty_high">Highest Quantity</option>
              <option value="qty_low">Lowest Quantity</option>
            </select>
          </div>
          <p class="filter-summary-line">
            Showing {{ filteredRequests.length }} of {{ requestStats.total }} requests
            ({{ requestStats.pending }} pending, {{ requestStats.accepted }} accepted, {{ requestStats.rejected }} rejected)
          </p>
          <div v-if="isLoadingUserRequests" class="empty-state">Loading your purchase requests...</div>
          <div v-else-if="userRequests.length === 0" class="empty-state">
            You haven't requested to buy any items yet.
          </div>
          <div v-else-if="filteredRequests.length === 0" class="empty-state">
            No purchase requests match your filters. Try adjusting your search or filters.
          </div>
          <div v-else class="listings-grid">
            <article
              v-for="request in filteredRequests"
              :key="request.id"
              class="profile-listing-card request-card clickable"
              role="link"
              tabindex="0"
              @click="goToListing(request.post_id)"
              @keydown.enter="goToListing(request.post_id)"
              @keydown.space.prevent="goToListing(request.post_id)"
            >
              <div class="card-top-row">
                <h3 class="item-title">{{ request.listing?.title || 'Marketplace listing' }}</h3>
                <span class="status-badge" :class="String(request.status || 'pending').toLowerCase()">
                  {{ String(request.status || 'pending').toUpperCase() }}
                </span>
              </div>
              <div class="listing-meta-row">
                <span><strong>Quantity:</strong> {{ request.quantity ?? request.requested_quantity ?? 'Not specified' }}</span>
                <span><strong>Seller:</strong> {{ request.seller?.full_name || 'Seller' }}</span>
              </div>
              <p class="request-date">
                Requested {{ request.created_at ? new Date(request.created_at).toLocaleDateString() : 'date unavailable' }}
              </p>
              <p v-if="request.notes" class="item-description">{{ request.notes }}</p>
            </article>
          </div>
        </template>

        <div v-else class="tab-placeholder-card">
          <p>Displaying {{ activeTab }} content...</p>
        </div>
<<<<<<< HEAD
=======

>>>>>>> origin/fiona
      </section>
    </div>
  </div>
  <EditProfileModal
    v-model="isEditModalOpen"
    :initialData="profileData"
    @save="handleSaveProfile"
  />
</template>

<style scoped>
.profile-page {
  width: 100%;
  min-height: 100vh;
  padding-bottom: 80px;
  background: var(--color-bg-main, #F7F8F6);
}

.profile-header-container {
  width: 100%;
  background: white;
  border-bottom: 1px solid #E4E7E3;
  display: flex;
  flex-direction: column;
}

.profile-banner {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.profile-info-block {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 40px 24px 40px;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  box-sizing: border-box;
}

.avatar-overlap-wrapper {
  width: 120px;
  height: 120px;
  position: absolute;
  left: 40px;
  top: -60px;
}

.avatar-ring {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 9999px;
  border: 4px solid #E4E7E3;
}

.avatar-placeholder-spacer {
  width: 120px;
  height: 60px;
  flex-shrink: 0;
}

.user-meta-main {
  flex: 1;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.names {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-display-name {
  margin: 0;
  color: #1A1D1A;
  font-size: 24px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.verified-badge {
  flex-shrink: 0;
}

.user-subtext {
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.btn-edit-profile {
  padding: 8px 20px;
  background: var(--color-brand, #778732);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-edit-profile:hover {
  opacity: 0.9;
}

.user-bio {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  line-height: 1.5;
}

.profile-stats-wrapper {
  width: 100%;
  background: #F7F8F6;
  border-top: 1px solid #E4E7E3;
  border-bottom: 1px solid #E4E7E3;
}

.profile-stats-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  height: 72px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-sizing: border-box;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value {
  color: #1A1D1A;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.stat-label {
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.profile-tabs {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  height: 48px;
  padding: 0 40px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  box-sizing: border-box;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0 0 12px 0;
  color: #8F9A8F;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: var(--color-brand, #778732);
  font-weight: 600;
  border-bottom-color: var(--color-brand, #778732);
}

.main-layout-wrapper {
  max-width: 1380px;
  margin: 0 auto;
  padding: 24px 80px 0 80px;
  display: flex;
  gap: 32px;
}

.left-feed-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.right-sidebar-column {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-placeholder-card {
  padding: 32px;
  background: white;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
  color: #8F9A8F;
  text-align: center;
}

.listings-filter-bar,
.requests-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
}

.listing-filter-control {
  min-width: 150px;
  max-width: 100%;
  padding: 8px 12px;
  border: 1px solid #E4E7E3;
  border-radius: 8px;
  background: #ffffff;
  color: #1A1D1A;
  font: inherit;
}

.listing-search {
  flex: 1 1 260px;
}

.filter-summary-line {
  margin: -4px 0 0;
  color: #687168;
  font-size: 14px;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.profile-listing-card {
  min-width: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.request-card.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.request-card.clickable:hover,
.request-card.clickable:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.item-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 18px;
  font-weight: 700;
}

.item-category {
  display: inline-block;
  margin-top: 4px;
  color: #778732;
  font-size: 13px;
}

.item-description {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  line-height: 1.5;
}

.status-badge,
.leads-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #F0F2EF;
  color: #525A52;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.available {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.sold {
  background: #FFEBEE;
  color: #C62828;
}

.status-badge.pending {
  background: #FFF8E1;
  color: #F57F17;
}

.status-badge.accepted {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.rejected {
  background: #FFEBEE;
  color: #C62828;
}

.request-listing-link {
  color: inherit;
  text-decoration: none;
}

.request-listing-link:hover .item-title {
  color: #66772B;
}

.request-date {
  margin: 0;
  color: #8F9A8F;
  font-size: 13px;
}

.listing-meta-row,
.listing-card-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: #525A52;
  font-size: 13px;
}

.listing-card-footer {
  padding-top: 12px;
  border-top: 1px solid #E4E7E3;
}

.manage-requests-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #66772B;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.manage-requests-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .main-layout-wrapper {
    flex-direction: column;
    padding: 24px 24px 0 24px;
  }

  .listings-grid {
    grid-template-columns: 1fr;
  }

  .listings-filter-bar,
  .requests-filter-bar {
    align-items: stretch;
  }

  .listing-filter-control,
  .listing-search {
    width: 100%;
    min-width: 0;
    flex-basis: 100%;
  }

  .empty-state {
    padding: 32px;
    background: white;
    border-radius: 12px;
    border: 1px solid #E4E7E3;
    color: #8F9A8F;
    text-align: center;
    font-family: 'Geist', sans-serif;
  }

  .profile-info-block,
  .profile-stats-row,
  .profile-tabs {
    padding-left: 24px;
    padding-right: 24px;
  }

  .right-sidebar-column {
    width: 100%;
  }

}
</style>
