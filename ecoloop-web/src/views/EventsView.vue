<script setup lang="ts">

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
</script>

<template>
  <main class="events-page">

    <EventHero />

    <MaterialsNeededCard />

    <EventStats />

    <div class="event-columns">

      <section class="event-left-column">
        <AboutProjectCard />
        <RecentDonationsCard />
      </section>

      <aside class="event-right-column">
        <CampaignOrganizerCard />
        <ProjectLocationCard />
        <DonorsLeaderboard />
        <RelatedEventsCard />
      </aside>

    </div>

  </main>
</template>
