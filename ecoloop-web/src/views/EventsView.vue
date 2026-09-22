<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvents } from '../composables/useEvents'
import type { EventItem } from '../types/event'

import EventHero from '../components/events/EventHero.vue'
import EventStats from '../components/events/EventStats.vue'
import MaterialsNeededCard from '../components/events/MaterialsNeededCard.vue'
import RecentDonationsCard from '../components/events/RecentDonationsCard.vue'
import DonorsLeaderboard from '../components/events/DonorsLeaderboard.vue'
import RelatedEventsCard from '../components/events/RelatedEventsCard.vue'

// Import Modals
import DonateMaterialsModal from '../components/Modals/DonateMaterialsModal.vue'
import ThankYouDonationModal from '../components/Modals/ThankYouDonationModal.vue'

const route = useRoute()
const router = useRouter()
const { fetchEventById, loading } = useEvents()
const event = ref<EventItem | null>(null)

// Modal State Controls
const isDonateModalOpen = ref(false)
const isThankYouModalOpen = ref(false)

// Payload details for Thank You screen
const thankYouDetails = ref({
  quantity: 0,
  materialName: '',
  projectName: '',
  authorUsername: ''
})

async function loadEventData() {
  const eventId = route.params.id as string
  if (eventId) {
    event.value = await fetchEventById(eventId)
  }
}

function handleOpenDonateModal() {
  console.log('parent: open-donate received')
  isDonateModalOpen.value = true
}

function handleDonationSubmitted(payload: { pledgeId: string; quantity: number; materialName: string }) {
  if (!event.value) return

  thankYouDetails.value = {
    quantity: payload.quantity,
    materialName: payload.materialName,
    projectName: event.value.event_title,
    authorUsername: event.value.organizer?.name || 'Campaign Organizer'
  }

  // Close donation modal and open thank you modal
  isDonateModalOpen.value = false
  isThankYouModalOpen.value = true
}

onMounted(() => {
  loadEventData()
})

// Auto-reload event details when clicking related events in the sidecard
watch(
  () => route.params.id,
  () => {
    loadEventData()
  }
)
</script>

<template>
  <div v-if="loading" class="loading-state">
    <p>Loading event details...</p>
  </div>

  <div v-else-if="event" class="event-details-page">
    <!-- Hero with Trigger for Donate Modal -->
    <EventHero :event="event" @open-donate="handleOpenDonateModal" />

    <div class="event-main-layout">
      <!-- Main Content Column -->
      <div class="main-column">
        <EventStats :stats="event.stats" />

        <div class="card about-card">
          <h3>About This Project</h3>
          <p>{{ event.description }}</p>
        </div>

        <MaterialsNeededCard :materials="event.materials_needed" @open-donate="handleOpenDonateModal" />
        <RecentDonationsCard :pledges="event.recent_pledges" />
      </div>

      <!-- Right Sidebar Column -->
      <aside class="sidebar-column">
        <div v-if="event.organizer" class="card organizer-card">
          <h4>Campaign Organizer</h4>
          <div class="organizer-info">
            <img :src="event.organizer.avatar" :alt="event.organizer.name" class="organizer-avatar" />
            <div>
              <strong>{{ event.organizer.name }}</strong>
              <p v-if="event.organizer.bio">{{ event.organizer.bio }}</p>
            </div>
          </div>
        </div>

        <DonorsLeaderboard :donors="event.top_donors" />
        <RelatedEventsCard :events="event.related_events" />
      </aside>
    </div>

    <!-- 1. Donate Materials Modal -->
    <DonateMaterialsModal
      v-model="isDonateModalOpen"
      :post-id="String(event.id ?? '')"
      target-type="event"
      @submitted="handleDonationSubmitted"
    />

    <!-- 2. Thank You Confirmation Modal -->
    <ThankYouDonationModal
      v-model="isThankYouModalOpen"
      :quantity="thankYouDetails.quantity"
      :material-name="thankYouDetails.materialName"
      :project-name="thankYouDetails.projectName"
      :author-username="thankYouDetails.authorUsername"
      @view-donations="router.push('/donations')"
      @back-to-post="isThankYouModalOpen = false"
    />
  </div>

  <div v-else class="not-found-state">
    <p>Event not found.</p>
  </div>
</template>

<style scoped>
.event-details-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.event-main-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 24px;
}

@media (min-width: 992px) {
  .event-main-layout {
    grid-template-columns: 2fr 1fr;
  }
}

.main-column,
.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.organizer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.loading-state,
.not-found-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
}
</style>
