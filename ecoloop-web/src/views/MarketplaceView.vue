
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CreateMarketplaceModal from '../components/Modals/CreateMarketplaceModal.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
import PopularCategoriesCard from '../components/marketplace/PopularCategoriesCard.vue'
import type { Listing } from '../types/marketplace'
import mockListingsData from '../data/mockMarketplace.json'
import BackButton from '../components/common/BackButton.vue'

const activeCategory = ref('All Materials')
const categories = ['All Materials', 'Wood', 'Glass', 'Metal', 'Plastic', 'Tires', 'Fabric', 'Electronics']
const mockListings = ref<Listing[]>([])
const selectedListing = ref<any>(null)
const showEditModal = ref(false)
const showBuyModal = ref(false)

function editListing(listing: Listing | undefined) {
  selectedListing.value = listing
  showEditModal.value = true
}

function requestToBuy(listing: Listing | undefined) {
  selectedListing.value = listing
  showBuyModal.value = true
}

onMounted(() => {
  mockListings.value = mockListingsData as Listing[]
})
</script>

<template>
  <!-- Top-level view container -->
  <div class="marketplace-view">
    <!-- Category Filter Bar -->
    <div class="categories-bar">
      <div class="categories-left">
        <button
          v-for="cat in categories"
          :key="cat"
          class="category-pill"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Main Content & Sidebar Grid -->
    <div class="page-layout">
      <main class="page-content">
        <BackButton />
        <div class="intro-banner">
          <h2>♻️ Community Circular Marketplace</h2>
          <p>
            List materials you have left over or find upcycled materials for your next project.
            All exchanges help reduce municipal landfill waste.
          </p>
        </div>

        <div class="listings-grid">
          <MarketplaceCard
            v-for="item in mockListings"
            :key="item.id"
            :listing="item"
            @edit="editListing"
            @request-buy="requestToBuy"
          />
        </div>
      </main>

      <aside class="right-sidebar">
        <PopularCategoriesCard />
      </aside>
    </div>

    <CreateMarketplaceModal
      v-model="showEditModal"
      :initial-listing="selectedListing"
    />
    <BuyRequestModal
      v-model="showBuyModal"
      :post="selectedListing"
    />
  </div>
</template>

<style scoped>
.marketplace-view {
  width: 100%;
  min-height: 100vh;
  background-color: #F8F9F8;
}

.categories-bar {
  background: white;
  border-bottom: 1px solid #E4E7E3;
  padding: 14px 48px;
}

.categories-left {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.category-pill {
  border: 1px solid #E4E7E3;
  background: white;
  color: #1A1D1A;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.category-pill.active {
  background: #778732;
  color: white;
  border-color: #778732;
}

.page-layout {
  display: flex;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 48px;
}

.page-content {
  flex: 1;
}

.right-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.intro-banner {
  background: white;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.intro-banner h2 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #1A1D1A;
}

.intro-banner p {
  margin: 0;
  font-size: 14px;
  color: #525A52;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

@media (max-width: 1100px) {
  .right-sidebar {
    display: none;
  }
}
</style>
