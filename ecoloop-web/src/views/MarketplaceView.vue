<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
// import CommunityRules from '../components/sidebar/CommunityRules.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import { useMarketplace } from '../composables/useMarketplace'
import type { MarketplaceListing } from '../composables/useMarketplace'
import { useSort } from '../composables/useSort'

const route = useRoute()
const router = useRouter()
const { listings, fetchListings } = useMarketplace()
const { selectedSort } = useSort()

const selectedListing = ref<MarketplaceListing | null>(null)
const isBuyRequestModalOpen = ref(false)

// User Location State for the 'Nearest' filter
const userLocation = ref<{ lat: number; lng: number } | null>(null)

onMounted(() => {
  fetchListings()

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      (err) => {
        console.warn('Geolocation denied or failed, using default location.', err)
        userLocation.value = { lat: 9.3068, lng: 123.3054 }
      }
    )
  } else {
    userLocation.value = { lat: 9.3068, lng: 123.3054 }
  }
})

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
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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
        case 'New':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'Hot':
          return (b.author?.score || 0) - (a.author?.score || 0)
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

function handleMarketplaceEdit(listing: MarketplaceListing | undefined) {
  if (listing) {
    // This pushes exactly to the route named 'MarketDetail'
    router.push({ name: 'MarketDetail', params: { id: listing.id } })
  }
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
  <div>
    <CategoryBar />

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

      <!-- Sidebar left blank so Community Rules doesn't show! -->
      <template #sidebar>
      </template>
    </PageLayout>

    <BuyRequestModal
      v-model="isBuyRequestModalOpen"
      :post="selectedListing"
      @submit="refreshListings"
    />
  </div>
</template>

<style scoped>
.marketplace-categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-pill {
  padding: 8px 20px;
  border-radius: 24px;
  border: 1.5px solid transparent;
  background: #f0f2ef;
  color: #3f463f;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-pill:hover { 
  background: #e4e7e3; 
  transform: translateY(-1px);
}

.category-pill--active { 
  background: #778732; 
  color: #ffffff; 
  box-shadow: 0 4px 12px rgba(119, 135, 50, 0.25);
  transform: translateY(-1px);
}

.events-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.events-list-page h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1d1a;
  margin: 0;
  padding-left: 8px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
}

.not-found-state {
  text-align: center;
  padding: 48px 16px;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
}
</style>
