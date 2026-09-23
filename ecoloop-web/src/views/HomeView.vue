<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const { posts } = usePosts()
const { events, fetchEvents } = useEvents()
const { selectedSort } = useSort()
onMounted(() => {
  fetchEvents()
})

const feed = computed(() => {
  const combined = [
    ...posts.value.map((p) => ({ kind: 'post' as const, item: p })),
    ...events.value.map((e) => ({ kind: 'event' as const, item: e })),
  ]

  if (selectedSort.value === 'New') {
    return combined.sort((a, b) => {
      const dateA = new Date((a.item as any).created_at || (a.item as any).schedule || 0).getTime()
      const dateB = new Date((b.item as any).created_at || (b.item as any).schedule || 0).getTime()
      return dateB - dateA
    })
  }

  if (selectedSort.value === 'Top' || selectedSort.value === 'Hot') {
    return combined.sort((a, b) =>
      ((b.item as any).likes_count || (b.item as any).upvotes || 0) -
      ((a.item as any).likes_count || (a.item as any).upvotes || 0)
    )
  }

  return combined
})

const sidebarEvents = computed(() => events.value.slice(0, 5))

function openEvent(id: string | number) {
  router.push(`/events/${id}`)
}

function calculateProgress(eventItem: any): number {
  const materials = eventItem.materials_needed || eventItem.event_materials || []
  if (!materials || materials.length === 0) {
    return eventItem.fulfillment_percent ?? 0
  }

  const totalTarget = materials.reduce((sum: number, m: any) => {
    const val = Number(m.target_quantity ?? m.target ?? 0)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const totalCurrent = materials.reduce((sum: number, m: any) => {
    const val = Number(m.current_quantity ?? m.current ?? 0)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  if (totalTarget <= 0) return 0

  return Math.min(100, Math.round((totalCurrent / totalTarget) * 100))
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
