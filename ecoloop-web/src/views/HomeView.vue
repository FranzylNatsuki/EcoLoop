<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import MarketCard from '../components/posts/MarketCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import { usePosts } from '../composables/usePosts'
import { useEvents } from '../composables/useEvents'
import { useMarketplace } from '../composables/useMarketplace'

const router = useRouter()
const { posts, fetchPosts } = usePosts()
const { events, fetchEvents } = useEvents()
const { listings, fetchListings } = useMarketplace()
const selectedListing = ref<any>(null)
const isBuyRequestModalOpen = ref(false)

function handleMarketplaceEdit(post: any) {
  openMarketplaceItem(post.id)
}

function handleMarketplaceRequest(post: any) {
  selectedListing.value = post
  isBuyRequestModalOpen.value = true
}

async function refreshMarketplaceRequests() {
  await fetchListings()
}

onMounted(() => window.addEventListener('purchase-request-submitted', refreshMarketplaceRequests))
onUnmounted(() => window.removeEventListener('purchase-request-submitted', refreshMarketplaceRequests))

const combinedFeed = computed(() => {
  const normalizedPosts = (posts.value || []).map(p => ({
    type: 'post' as const,
    created_at: p.created_at,
    item: p
  }))

  const normalizedEvents = (events.value || []).map(e => ({
    type: 'event' as const,
    created_at: e.schedule || (e as any).created_at || new Date().toISOString(),
    item: e
  }))

  const normalizedListings = (listings.value || []).map(l => ({
    type: 'marketplace' as const,
    created_at: l.created_at,
    item: l
  }))

  return [...normalizedPosts, ...normalizedEvents, ...normalizedListings].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const sidebarEvents = computed(() => events.value.slice(0, 5))

function openEvent(id: string | number) {
  router.push(`/events/${id}`)
}

function openMarketplaceItem(id: string | number) {
  router.push({ name: 'MarketDetail', params: { id } })
}

onMounted(() => {
  fetchPosts()
  fetchEvents()
  fetchListings()
})
</script>

<template>
  <div>
    <CategoryBar />
    <PageLayout>
      <template #main>
        <template v-for="entry in combinedFeed" :key="`${entry.type}-${entry.item.id}`">
          <EventCard
            v-if="entry.type === 'event'"
            :event="(entry.item as any)"
            @click="openEvent(entry.item.id)"
          />
          <MarketCard
            v-else-if="entry.type === 'marketplace'"
            :post="(entry.item as any)"
            @click="openMarketplaceItem(entry.item.id)"
            @edit="handleMarketplaceEdit"
            @request-buy="handleMarketplaceRequest"
            @purchase-request-submitted="refreshMarketplaceRequests"
          />
          <PostCard v-else :post="(entry.item as any)" />
        </template>
      </template>

      <template #sidebar>
        <CommunityRules />
        <TrendingTopics />

        <div v-if="sidebarEvents.length > 0" class="sidebar-events-wrapper">
          <EventPreview
            v-for="eventItem in sidebarEvents"
            :key="eventItem.id"
            :image="eventItem.image"
            :title="eventItem.event_title"
            :category="eventItem.category"
            :date="eventItem.schedule"
            :description="eventItem.description"
            :location="eventItem.location"
            :funded-percentage="eventItem.fulfillment_percent ?? 0"
            @click="openEvent(eventItem.id)"
          />
        </div>
        <EventPreview
          v-else
          image="https://placehold.co/247x120"
          date="Sat, Oct 12"
          title="Community Clean-Up Day"
          description="Join us for a neighborhood clean-up and learn how to sort materials for local recycling centers."
          location="Riverfront Park • 10:00 AM"
        />
      </template>
    </PageLayout>
    <BuyRequestModal
      v-model="isBuyRequestModalOpen"
      :post="selectedListing"
      @submit="refreshMarketplaceRequests"
    />
  </div>
</template>

<style scoped>
.sidebar-events-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
