<script setup lang="ts">
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import MarketCard from '../components/posts/MarketCard.vue';

const testMarketPost = {
  id: 'test-market-1',
  title: 'Reclaimed Wood Pallets — Free to Good Home',
  body: 'About 15 sturdy wooden pallets, great for garden beds or upcycling projects. Pickup only.',
  category: 'Marketplace',
  vote_count: 4,
  comment_count: 2,
  comments: 2,
  created_at: new Date().toISOString(),
  author: {
    full_name: 'Jane Dela Cruz',
    Avatar: 'https://placehold.co/38x38',
  },
  post_images: [
    { image_url: 'https://placehold.co/600x360', display_order: 0 },
  ],
  // These are what THIS component's v-if actually checks to show the marketplace footer:
  type: 'marketplace',
  price: 0,
}
</script>

<template>
  <div>
    <CategoryBar />
    <PageLayout>
      <template #main>
        <h2 style="margin: 16px 0; font-family: 'Outfit', sans-serif;">
          Marketplace Debug View (1 test item)
        </h2>
        <MarketCard :post="testMarketPost as any" />
      </template>
      <template #sidebar>
        <CommunityRules />
      </template>
    </PageLayout>
  </div>
</template>
