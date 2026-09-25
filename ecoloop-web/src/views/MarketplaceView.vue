<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplace } from '../composables/useMarketplace'
import type { MarketplaceListing } from '../composables/useMarketplace'
import { useSort } from '../composables/useSort'

// Layout & Components
import CategoryBar from '../components/layout/CategoryBar.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'

const route = useRoute()
const router = useRouter()
const { listings, fetchListings } = useMarketplace()
const { selectedSort } = useSort()

const singleListing = ref<MarketplaceListing | null>(null)
const selectedListing = ref<MarketplaceListing | null>(null)
const isBuyRequestModalOpen = ref(false)
const userLocation = ref<{ lat: number; lng: number } | null>(null)
const loading = ref(false)

// 1. Data Loading Logic (Handles both Single ID and List view)
async function loadListingData() {
  loading.value = true
  const listingId = route.params.id as string | undefined

  if (listingId) {
    // SINGLE VIEW MODE (/marketplace/:id)
    if (listings.value.length === 0) await fetchListings()
    singleListing.value = listings.value.find(l => String(l.id) === listingId) || null
  } else {
    // LIST VIEW MODE (/marketplace)
    singleListing.value = null
    await fetchListings()
  }
  loading.value = false
}

onMounted(() => {
  loadListingData()

  // Location for Nearest filter
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude },
      () => userLocation.value = { lat: 9.3068, lng: 123.3054 } // Dumaguete Fallback
    )
  } else {
    userLocation.value = { lat: 9.3068, lng: 123.3054 }
  }
})

// Watch for URL ID changes to swap between list/single view
watch(() => route.params.id, () => loadListingData())

// 2. Sub-Category Filtering Logic
const categories = [
  { label: 'All', value: '' },
  { label: 'Plastics', value: 'Plastics' },
  { label: 'Glass', value: 'Glass' },
  { label: 'Paper/Cardboard', value: 'Paper/Cardboard' },
  { label: 'Metal', value: 'Metal' },
  { label: 'Electronics', value: 'Electronics' },
]

const activeCategory = computed(() => (route.query.category as string) || '')

function setCategory(value: string) {
  router.push({ path: '/marketplace', query: value ? { category: value } : {} })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const filteredListings = computed(() => {
  let result = listings.value

  const selectedCat = activeCategory.value.trim().toLowerCase()
  if (selectedCat && selectedCat !== 'all' && selectedCat !== 'all categories') {
    result = result.filter((l) => {
      const itemCat = l.category?.trim().toLowerCase() || ''
      return itemCat.includes(selectedCat) || selectedCat.includes(itemCat)
    })
  }

  if (selectedSort.value) {
    result = [...result].sort((a, b) => {
      switch (selectedSort.value) {
        case 'New': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'Hot': return (b.author?.score || 0) - (a.author?.score || 0)
        case 'Nearest':
          if (!userLocation.value) return 0
          const distA = (a.latitude && a.longitude) ? calculateDistance(userLocation.value.lat, userLocation.value.lng, a.latitude, a.longitude) : Infinity
          const distB = (b.latitude && b.longitude) ? calculateDistance(userLocation.value.lat, userLocation.value.lng, b.latitude, b.longitude) : Infinity
          return distA - distB
        default: return 0
      }
    })
  }
  return result
})

function openMarketplaceItem(id: string | number) {
  router.push(`/marketplace/${id}`) // <--- Now pushes to itself with an ID!
}

function handleMarketplaceEdit(listing: MarketplaceListing | undefined) {
  if (listing) openMarketplaceItem(listing.id)
}

function handleMarketplaceRequest(listing: MarketplaceListing | undefined) {
  if (listing) {
    selectedListing.value = listing
    isBuyRequestModalOpen.value = true
  }
}

async function refreshListings() {
  await fetchListings()
}
</script>

<template>
  <!-- 1. SINGLE LISTING DETAIL VIEW (/marketplace/:id) -->
  <div v-if="route.params.id" class="event-page-wrapper">
    <div v-if="loading" class="loading-state">
      <p>Loading listing details...</p>
    </div>

    <div v-else-if="singleListing" class="event-details-container">
      <!-- NOTE: Place your MarketDetail components here, replacing this placeholder -->
      <div class="card about-card">
        <h2>{{ singleListing.title }}</h2>
        <p>{{ singleListing.description }}</p>
        <button class="btn-back" @click="router.push('/marketplace')" style="margin-top: 20px;">
          Back to All Listings
        </button>
      </div>
    </div>

    <div v-else class="not-found-state">
      <p>Listing not found or failed to load.</p>
      <button class="btn-back" @click="router.push('/marketplace')">Back to All Listings</button>
    </div>
  </div>

  <!-- 2. ALL LISTINGS LIST VIEW (/marketplace) -->
  <template v-else>
    <CategoryBar />

    <!-- Material Sub-categories -->
    <nav class="marketplace-categories">
      <button
        v-for="cat in categories"
        :key="cat.label"
        class="category-pill"
        :class="{ 'category-pill--active': activeCategory === cat.value }"
        @click="setCategory(cat.value)"
      >
        {{ cat.label }}
      </button>
    </nav>

    <PageLayout>
      <template #main>
        <div class="events-list-page">
          <h2>Marketplace</h2>

          <div v-if="filteredListings.length === 0" class="not-found-state">
            <p>No listings found{{ activeCategory ? ` in "${activeCategory}"` : '' }}.</p>
          </div>

          <div v-else class="events-grid">
            <MarketplaceCard
              v-for="listing in filteredListings"
              :key="listing.id"
              :listing="listing"
              @edit="handleMarketplaceEdit(listing)"
              @request-buy="handleMarketplaceRequest(listing)"
            />
          </div>
        </div>
      </template>
    </PageLayout>
  </template>

  <BuyRequestModal
    v-model="isBuyRequestModalOpen"
    :post="selectedListing"
    @submit="refreshListings"
  />
</template>

<style scoped>
/* Marketplace Material Categories */
.marketplace-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 0;
  max-width: 1200px;
  margin: 0 auto;
}
.category-pill {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e4e7e3;
  background: #ffffff;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.category-pill:hover { background: #f0f4ea; border-color: #778732; }
.category-pill--active { background: #778732; border-color: #778732; color: #ffffff; }

/* Grid Layout matching EventView */
.events-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
.events-list-page h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1d1a;
  margin: 0;
}
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

/* Single View Layout Matching EventView */
.event-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  width: 100%;
}
.event-details-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.about-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}
.loading-state,
.not-found-state {
  text-align: center;
  padding: 48px 16px;
}
.btn-back {
  padding: 8px 16px;
  background: #778732;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>
