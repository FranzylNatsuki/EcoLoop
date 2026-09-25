<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import BuyRequestModal from '../components/Modals/BuyRequestModal.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import UserCard from '../components/posts/UserCard.vue'
import MarketplaceCard from '../components/marketplace/MarketplaceCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
// import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import { useSort } from '../composables/useSort'
import { usePosts } from '../composables/usePosts'
import { useEvents } from '../composables/useEvents'
import { useSearch } from '../composables/useSearch'
import { supabase } from '../composables/useAuth'
import { useMarketplace } from '../composables/useMarketplace'

const route = useRoute()
const router = useRouter()
const { posts, fetchPosts } = usePosts()
const { events, fetchEvents } = useEvents()
const { listings, fetchListings } = useMarketplace()
const { selectedSort } = useSort()
const { debouncedSearchQuery } = useSearch()
const searchedUsers = ref<any[]>([])
const selectedListing = ref<any>(null)
const isBuyRequestModalOpen = ref(false)

onMounted(() => {
  fetchPosts()
  fetchEvents()
  fetchListings()
})

onMounted(() => window.addEventListener('purchase-request-submitted', refreshMarketplaceRequests))
onUnmounted(() => window.removeEventListener('purchase-request-submitted', refreshMarketplaceRequests))

// Refetch data anytime the search query updates
watch(debouncedSearchQuery, async (newQuery) => {
  fetchEvents({ searchQuery: newQuery })
  fetchPosts(newQuery)

  // Fetch users for the main feed if there's a search term
  if (newQuery.trim()) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, location, profile_data(Avatar)')
      .or(`full_name.ilike.%${newQuery.trim()}%,location.ilike.%${newQuery.trim()}%`)
      .limit(3)

    searchedUsers.value = data || []
  } else {
    searchedUsers.value = []
  }
})

const feed = computed(() => {
  let combined = [
    ...posts.value.map((p) => ({ kind: 'post' as const, item: p })),
    ...events.value.map((e) => ({ kind: 'event' as const, item: e })),
    ...listings.value.map((l) => ({ kind: 'marketplace' as const, item: l })),
    ...searchedUsers.value.map((u) => ({ kind: 'user' as const, item: u })),
  ]

  const activeCategory = (route.query.category as string || '').toLowerCase()

  if (activeCategory) {
    combined = combined.filter((entry) => {
      const item = entry.item as any

      // IF USER CLICKED "Cause Requests" IN SIDEBAR (/home?category=cause)
      if (activeCategory === 'cause' || activeCategory === 'cause_request') {
        return (
          entry.kind === 'post' &&
          (
            item.post_type?.toLowerCase().includes('cause') ||
            item.type?.toLowerCase().includes('cause') ||
            item.is_cause === true ||
            true
          )
        )
      }

      // FOR TOP CATEGORY PILLS
      const itemCat = (item.category || item.event_category || '').toLowerCase()
      return itemCat === activeCategory
    })
  }

  if (selectedSort.value === 'New') {
    return combined.sort((a, b) => {
      const dateA = new Date((a.item as any).created_at || (a.item as any).schedule || 0).getTime()
      const dateB = new Date((b.item as any).created_at || (b.item as any).schedule || 0).getTime()
      return dateB - dateA
    })
  }

  if (selectedSort.value === 'Hot') {
    return combined.sort((a, b) =>
      ((b.item as any).likes_count || (b.item as any).upvotes || (b.item as any).vote_count || 0) -
      ((a.item as any).likes_count || (a.item as any).upvotes || (a.item as any).vote_count || 0)
    )
  }

  if (selectedSort.value === 'Nearest') {
    return combined.sort((a, b) => {
      const distA = Number((a.item as any).distance) || Infinity
      const distB = Number((b.item as any).distance) || Infinity
      return distA - distB
    })
  }

  return combined
})

const sidebarEvents = computed(() => events.value.slice(0, 5))

function openEvent(id: string | number) {
  router.push(`/events/${id}`)
}

function openMarketplaceItem(id: string | number) {
  router.push(`/marketplace/${id}`)}

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

function calculateProgress(eventItem: any): number {
  const goal = Number(eventItem.target_items || 0)
  const donated = Number(eventItem.donated_items || 0)

  if (goal <= 0) return eventItem.fulfillment_percent ?? 0

  return Math.min(100, Math.round((donated / goal) * 100))
}
</script>

<template>
  <div>
    <CategoryBar />
    <PageLayout>
      <template #main>
        <template v-for="entry in feed" :key="`${entry.kind}-${entry.item.id}`">
          <!-- Render User Card -->
          <UserCard
            v-if="entry.kind === 'user'"
            :user="entry.item"
          />

          <EventCard
            v-else-if="entry.kind === 'event'"
            :event="entry.item"
            @click="openEvent(entry.item.id)"
          />

          <MarketplaceCard
            v-else-if="entry.kind === 'marketplace'"
            :listing="(entry.item as any)"
            variant="feed"
            @edit="handleMarketplaceEdit"
            @request-buy="handleMarketplaceRequest"
          />

          <PostCard v-else :post="entry.item" />
        </template>
      </template>

      <!-- Only right sidebar widgets belong here -->
      <template #sidebar>
        <CommunityRules />
        <!-- <TrendingTopics /> -->

        <div v-if="sidebarEvents.length > 0" class="sidebar-events-wrapper">
          <EventPreview
            v-for="eventItem in sidebarEvents"
            :key="eventItem.id"
            :id="eventItem.id"
            :image="eventItem.image"
            :title="eventItem.event_title"
            :category="eventItem.category"
            :date="eventItem.schedule"
            :description="eventItem.description"
            :location="eventItem.location"
            :funded-percentage="calculateProgress(eventItem)"
            @click="openEvent(eventItem.id)"
          />
        </div>
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

.main-feed {
  display: flex;
  flex-direction: column;
  gap: 16px; /* single source of truth for spacing */
}
</style>
