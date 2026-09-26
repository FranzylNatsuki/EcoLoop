<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvents } from '../composables/useEvents'
import type { EventItem } from '../types/event'

import CategoryBar from '../components/layout/CategoryBar.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import EventHero from '../components/events/EventHero.vue'
import EventStats from '../components/events/EventStats.vue'
import MaterialsNeededCard from '../components/events/MaterialsNeededCard.vue'
import RecentDonationsCard from '../components/events/RecentDonationsCard.vue'
import DonorsLeaderboard from '../components/events/DonorsLeaderboard.vue'
import RelatedEventsCard from '../components/events/RelatedEventsCard.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'

// Import Modals
import DonateEventMaterialsModal from '../components/Modals/DonateEventMaterialsModal.vue'
import ThankYouDonationModal from '../components/Modals/ThankYouDonationModal.vue'
import EditEventModal from '../components/Modals/EditEventModal.vue'

import { supabase } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { events, fetchEvents, fetchEventById, loading, updateEvent } = useEvents()
const event = ref<EventItem | null>(null)
const currentUserId = ref<string | null>(null)

// Modal State Controls
const isDonateModalOpen = ref(false)
const isThankYouModalOpen = ref(false)
const isEditModalOpen = ref(false)

// Filtered Events Computed List
const filteredEvents = computed(() => {
  // Read category directly from URL query parameter
  const selected = (route.query.category as string || '').trim().toLowerCase()

  // Return all if no query param or set to 'all'
  if (!selected || selected === 'all' || selected === 'all categories') {
    return events.value
  }

  return events.value.filter((e) => {
    const eventCat = e.category?.trim().toLowerCase() || ''
    if (!eventCat) return false

    // Flexible match (e.g. "tree planting" matches "Tree Planting")
    return eventCat.includes(selected) || selected.includes(eventCat)
  })
})

// Payload details for Thank You screen
const thankYouDetails = ref({
  quantity: 0,
  materialName: '',
  projectName: '',
  authorUsername: ''
})

async function loadEventData() {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || null

  const eventId = route.params.id as string | undefined

  if (eventId) {
    // Single Event Mode (/events/:id)
    event.value = await fetchEventById(eventId)
    console.log('Current User ID:', currentUserId.value)
    console.log('Event Author ID:', event.value?.author_id)
  } else {
    // All Events Mode (/events)
    event.value = null
    await fetchEvents()
  }
}

const donatePrefillName = ref('')

function handleOpenDonateModal(materialName?: string) {
  if (typeof materialName === 'string') {
    donatePrefillName.value = materialName
  } else {
    donatePrefillName.value = ''
  }
  isDonateModalOpen.value = true
}

async function handleDonationSubmitted(payload: { pledgeId: string; quantity: number; materialName: string }) {
  if (!event.value) return

  await loadEventData()

  thankYouDetails.value = {
    quantity: payload.quantity,
    materialName: payload.materialName,
    projectName: event.value.event_title,
    authorUsername: event.value.organizer?.name || 'Campaign Organizer'
  }

  isDonateModalOpen.value = false
  isThankYouModalOpen.value = true
}

async function handleEditEvent(payload: { event: any; materials: any[] }) {
  if (!event.value?.id) return
  
  let finalBannerUrl = payload.event.bannerImage

  if (payload.event.rawFile) {
    const file = payload.event.rawFile
    const filePath = `event-banners/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) {
      alert('Failed to upload image: ' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    finalBannerUrl = publicUrlData.publicUrl
  }

  const result = await updateEvent(String(event.value.id), {
    title: payload.event.title,
    description: payload.event.description,
    category: payload.event.category,
    location: payload.event.location,
    latitude: payload.event.latitude,
    longitude: payload.event.longitude,
    event_date: payload.event.date + 'T' + payload.event.startTime + ':00',
    banner_url: finalBannerUrl,
    materials_needed: payload.materials
  })
  
  if (result.success) {
    isEditModalOpen.value = false
    await loadEventData()
  } else {
    alert('Failed to update event: ' + result.error)
  }
}

function openEventDetail(id: string) {
  router.push(`/events/${id}`)
}

onMounted(() => {
  loadEventData()
})

watch(
  () => route.params.id,
  () => {
    loadEventData()
  }
)
</script>

<template>
  <!-- 1. SINGLE EVENT DETAIL VIEW (/events/:id) -->
  <div v-if="route.params.id" class="event-page-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading event details...</p>
    </div>

    <div v-else-if="event" class="event-details-container">
      <div v-if="currentUserId && currentUserId === event.author_id" class="owner-actions">
        <button class="btn-edit-event" @click="isEditModalOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          Edit Event Details
        </button>
      </div>
      <EventHero :event="event" @open-donate="handleOpenDonateModal" />

      <div class="event-main-layout">
        <div class="main-column">
          <EventStats :stats="event.stats" />

          <div class="card about-card">
            <h3>About This Project</h3>
            <p>{{ event.description }}</p>
          </div>

          <MaterialsNeededCard :materials="event.materials_needed" @open-donate="handleOpenDonateModal" />
          <RecentDonationsCard :pledges="event.recent_pledges" />
        </div>

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

      <!-- Modals -->
      <EditEventModal
        v-model="isEditModalOpen"
        :initial-data="event"
        @publish="handleEditEvent"
      />
      <DonateEventMaterialsModal
        v-model="isDonateModalOpen"
        :post-id="String(event?.id || '')"
        :initial-material-name="donatePrefillName"
        @submitted="handleDonationSubmitted"
      />

      <ThankYouDonationModal
        v-model="isThankYouModalOpen"
        :quantity="thankYouDetails.quantity"
        :material-name="thankYouDetails.materialName"
        :project-name="thankYouDetails.projectName"
        :author-username="thankYouDetails.authorUsername"
        @view-donations="router.push({ path: '/profile', query: { tab: 'donations' } })"
        @back-to-post="isThankYouModalOpen = false"
      />
    </div>

    <div v-else class="not-found-state">
      <p>Event not found or failed to load.</p>
      <button class="btn-back" @click="router.push('/events')">Back to All Events</button>
    </div>
  </div>

  <!-- 2. ALL EVENTS LIST VIEW (/events) - Exactly matching HomeView structure -->
  <template v-else>
  <CategoryBar/>
    <PageLayout>
      <template #main>
        <div class="events-list-page">
          <h2>Community Events</h2>

          <div v-if="filteredEvents.length === 0" class="not-found-state">
            <p>No events found for this category.</p>
          </div>

          <div v-else class="events-grid">
            <EventPreview
              v-for="item in filteredEvents"
              :key="item.id"
              :id="item.id"
              :image="item.image"
              :title="item.event_title"
              :category="item.category"
              :date="item.schedule"
              :description="item.description"
              :location="item.location"
              :funded-percentage="item.fulfillment_percent"
              @click="openEventDetail(item.id)"
            />
          </div>
        </div>
      </template>
    </PageLayout>
  </template>
</template>

<style scoped>
/* --- ALL EVENTS FEED STYLES --- */
.events-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.events-list-page h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1d1a;
  margin: 0;
}

/* Formats event cards as a responsive grid across the main feed area */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

/* --- SINGLE EVENT DETAIL VIEW STYLES --- */
.owner-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -10px;
}

.btn-edit-event {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #F7F8F6;
  border: 1px solid #E4E7E3;
  color: #1A1D1A;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-event:hover {
  background-color: #E4E7E3;
  border-color: #778732;
}

.event-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  width: 100%;
}

.organizer-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.organizer-avatar {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  min-height: 48px !important;
  max-width: 48px !important;
  max-height: 48px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
}

.event-details-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.event-main-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.about-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.loading-state,
.not-found-state {
  text-align: center;
  padding: 48px 16px;
}

@media (max-width: 900px) {
  .event-main-layout {
    grid-template-columns: 1fr;
  }
}
</style>
