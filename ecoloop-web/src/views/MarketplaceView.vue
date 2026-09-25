<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import { useMarketplace } from '../composables/useMarketplace'
import type { MarketplaceListing } from '../composables/useMarketplace'

const route = useRoute()
const router = useRouter()
const { listings, fetchListings } = useMarketplace()

const selectedListing = ref<MarketplaceListing | null>(null)
const isBuyRequestModalOpen = ref(false)

onMounted(() => {
  fetchListings()
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

const filteredListings = computed(() => {
  if (!activeCategory.value) return listings.value
  return listings.value.filter((l) => l.category === activeCategory.value)
})

function openMarketplaceItem(id: string | number) {
  router.push({ name: 'MarketDetail', params: { id } })
}

function handleMarketplaceEdit(listing: MarketplaceListing | undefined) {
  if (!listing) return
  openMarketplaceItem(listing.id)
}

function handleMarketplaceRequest(listing: MarketplaceListing | undefined) {
  if (!listing) return
  selectedListing.value = listing
  isBuyRequestModalOpen.value = true
}

async function refreshListings() {
  await fetchListings()
}
</script>

<template>
  <div>
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
        <div v-if="filteredListings.length === 0" class="empty-state">
          No listings found{{ activeCategory ? ` in "${activeCategory}"` : '' }}.
        </div>

        <div class="marketplace-grid">
          <MarketplaceCard
            v-for="listing in filteredListings"
            :key="listing.id"
            :listing="listing"
            @edit="handleMarketplaceEdit"
            @request-buy="handleMarketplaceRequest"
          />
        </div>
      </template>

      <template #sidebar>
        <CommunityRules />
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
  gap: 8px;
  padding: 16px;
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

.category-pill:hover {
  background: #f0f4ea;
  border-color: #778732;
}

.category-pill--active {
  background: #778732;
  border-color: #778732;
  color: #ffffff;
}

.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding: 0 16px 16px;
}

.empty-state {
  padding: 40px 16px;
  text-align: center;
  color: #8f9a8f;
  font-size: 14px;
}
</style>
