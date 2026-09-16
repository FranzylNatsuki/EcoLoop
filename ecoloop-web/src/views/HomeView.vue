<script setup lang="ts">
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import CreatePostBar from '../components/posts/CreatePostBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import { usePosts } from '../composables/usePosts'
import { useEvents } from '../composables/useEvents'
import { computed } from 'vue'

const { posts } = usePosts()
const { events } = useEvents()

const feed = computed(() => [
  ...posts.value.map((p) => ({ kind: 'post' as const, item: p })),
  ...events.value.map((e) => ({ kind: 'event' as const, item: e })),
])

const currentUserAvatar = 'https://placehold.co/38x38'
</script>

<template>
  <div>
    <CategoryBar />
    <PageLayout>
      <template #main>
        <CreatePostBar :avatar="currentUserAvatar" />
        <template v-for="entry in feed" :key="`${entry.kind}-${entry.item.id}`">
          <EventCard v-if="entry.kind === 'event'" :event="entry.item" />
          <PostCard v-else :post="entry.item" />
        </template>
      </template>
      <template #sidebar>
        <CommunityRules />
        <TrendingTopics />
        <EventPreview banner="https://placehold.co/247x120" date="Sat, Oct 12"
          title="Community Clean-Up Day"
          description="Join us for a neighborhood clean-up and learn how to sort materials for local recycling centers."
          location="Riverfront Park • 10:00 AM" />
      </template>
    </PageLayout>
  </div>
</template>
