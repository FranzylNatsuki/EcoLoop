<script setup lang="ts">
import { computed } from 'vue'
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import CreatePostBar from '../components/posts/CreatePostBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import EventCard from '../components/posts/EventCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'

// Import or fetch your combined JSON feed items
import feedData from '../data/eventData.json'

// If you have separate post and event sources, you can combine them:
// const combinedFeed = computed(() => [...posts.value, ...events.value])

const currentUserAvatar = 'https://placehold.co/38x38'

function handleJoinEvent(eventId: number | string) {
  console.log('Joined event:', eventId)
}

function handleShareEvent(eventId: number | string) {
  console.log('Shared event:', eventId)
}
</script>

<template>
  <div>
    <CategoryBar />

    <PageLayout>
      <template #main>
        <CreatePostBar :avatar="currentUserAvatar" />

        <!-- Dynamic Feed Renderer -->
        <template v-for="item in feedData" :key="item.id">
          <!-- Render Event Card -->
          <EventCard
            v-if="item.type === 'event'"
            :event="item"
            @join="handleJoinEvent"
            @share="handleShareEvent"
          />

          <!-- Render Post Card -->
          <PostCard
            v-else-if="item.type === 'post' || !item.type"
            :post="item"
          />
        </template>
      </template>

      <template #sidebar>
        <CommunityRules />
        <TrendingTopics />
        <EventPreview
          banner="https://placehold.co/247x120"
          date="Sat, Oct 12"
          title="Community Clean-Up Day"
          description="Join us for a neighborhood clean-up and learn how to sort materials for local recycling centers."
          location="Riverfront Park • 10:00 AM"
        />
      </template>
    </PageLayout>
  </div>
</template>
