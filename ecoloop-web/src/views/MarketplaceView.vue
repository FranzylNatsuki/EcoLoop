<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import { useMarketplace } from '../composables/useMarketplace'
import type { MarketplaceListing } from '../composables/useMarketplace'
import { useSort, getHotnessScore } from '../composables/useSort'
import { useUserLocation } from '../composables/useUserLocation'

const route = useRoute()
const router = useRouter()
const { listings, fetchListings } = useMarketplace()
const { selectedSort } = useSort()

const selectedListing = ref<MarketplaceListing | null>(null)
const isBuyRequestModalOpen = ref(false)

const { fetchUserLocation, getItemDistance } = useUserLocation()

onMounted(() => {
  fetchListings()
  fetchUserLocation()
})


const activeCategory = computed(() => (route.query.category as string) || '')

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
          return getHotnessScore(b) - getHotnessScore(a)
        case 'Nearest':
          return getItemDistance(a) - getItemDistance(b)
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
    <CategoryBar type="marketplace" />

    

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

      <!-- Sidebar -->
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
