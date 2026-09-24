<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import { useSort } from '../composables/useSort'
import { usePosts } from '../composables/usePosts'
import { useEvents } from '../composables/useEvents'

const route = useRoute()
const router = useRouter()
const { posts } = usePosts()
const { events, fetchEvents } = useEvents()
const { selectedSort } = useSort()
onMounted(() => {
  fetchEvents()
})

  const feed = computed(() => {
    let combined = [
      ...posts.value.map((p) => ({ kind: 'post' as const, item: p })),
      ...events.value.map((e) => ({ kind: 'event' as const, item: e })),
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
      ((b.item as any).likes_count || (b.item as any).upvotes || 0) -
      ((a.item as any).likes_count || (a.item as any).upvotes || 0)
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
          <EventCard
            v-if="entry.kind === 'event'"
            :event="entry.item"
            @click="openEvent(entry.item.id)"
          />
          <PostCard v-else :post="entry.item" />
        </template>
      </template>

      <!-- Only right sidebar widgets belong here -->
      <template #sidebar>
        <CommunityRules />
        <TrendingTopics />

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
  </div>
</template>

<style scoped>
.sidebar-events-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
