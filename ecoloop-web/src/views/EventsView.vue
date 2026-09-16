<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import '../events.css'
import EventHero from '../components/events/EventHero.vue'
import MaterialsNeededCard from '../components/events/MaterialsNeededCard.vue'
import EventStats from '../components/events/EventStats.vue'
import AboutProjectCard from '../components/events/AboutProjectCard.vue'
import RecentDonationsCard from '../components/events/RecentDonationsCard.vue'
import CampaignOrganizerCard from '../components/events/CampaignOrganizerCard.vue'
import ProjectLocationCard from '../components/events/ProjectLocationCard.vue'
import DonorsLeaderboard from '../components/events/DonorsLeaderboard.vue'
import RelatedEventsCard from '../components/events/RelatedEventsCard.vue'
import { useEvents } from '../composables/useEvents'
import type { EventItem } from '../types/event'

const route = useRoute()
const { fetchEventById } = useEvents()
const event = ref<EventItem | null>(null)

onMounted(async () => {
  event.value = await fetchEventById(route.params.id as string)
})
</script>

<template>
  <main v-if="event" class="events-page">
    <EventHero :event="event" />
    <MaterialsNeededCard v-if="event.materials_needed" :materials="event.materials_needed" :fulfillment-percent="event.fulfillment_percent" />
    <EventStats v-if="event.stats" :stats="event.stats" :fulfillment-percent="event.fulfillment_percent" />

    <div class="event-columns">
      <section class="event-left-column">
        <AboutProjectCard :title="event.event_title" :body="event.description" />
        <RecentDonationsCard v-if="event.recent_pledges" :pledges="event.recent_pledges" />
      </section>

      <aside class="event-right-column">
        <CampaignOrganizerCard v-if="event.organizer" :organizer="event.organizer" />
        <ProjectLocationCard :location="event.location" :schedule="event.schedule" />
        <DonorsLeaderboard v-if="event.top_donors" :donors="event.top_donors" />
        <RelatedEventsCard v-if="event.related_events" :events="event.related_events" />
      </aside>
    </div>
  </main>
  <p v-else>Loading…</p>
</template>
