<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
// import CreatePostBar from '../components/posts/CreatePostBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import { usePosts } from '../composables/usePosts'
import { useEvents } from '../composables/useEvents'

const router = useRouter()
const { posts } = usePosts()
const { events, fetchEvents } = useEvents()

onMounted(() => {
  fetchEvents()
})

const feed = computed(() => [
  ...posts.value.map((p) => ({ kind: 'post' as const, item: p })),
  ...events.value.map((e) => ({ kind: 'event' as const, item: e })),
])

// Maximum 5 events in the sidebar preview
const sidebarEvents = computed(() => events.value.slice(0, 5))

function openEvent(id: string | number) {
  router.push(`/events/${id}`)
}

const currentUserAvatar = 'https://placehold.co/38x38'
</script>

<template>
  <div>
    <CategoryBar />
    <PageLayout>
      <template #main>
        <!-- <CreatePostBar :avatar="currentUserAvatar" /> -->
        <template v-for="entry in feed" :key="`${entry.kind}-${entry.item.id}`">
          <EventCard
            v-if="entry.kind === 'event'"
            :event="entry.item"
            @click="openEvent(entry.item.id)"
          />
          <PostCard v-else :post="entry.item" />
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
