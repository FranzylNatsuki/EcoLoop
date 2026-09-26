content = """<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvents } from '../composables/useEvents'
import { useSort } from '../composables/useSort'
import type { EventItem } from '../types/event'

import CategoryBar from '../components/layout/CategoryBar.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import BackButton from '../components/common/BackButton.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'

// Detail Components
import EventHero from '../components/events/EventHero.vue'
import EventStats from '../components/events/EventStats.vue'
import MaterialsNeededCard from '../components/events/MaterialsNeededCard.vue'
import RecentDonationsCard from '../components/events/RecentDonationsCard.vue'
import DonorsLeaderboard from '../components/events/DonorsLeaderboard.vue'
import RelatedEventsCard from '../components/events/RelatedEventsCard.vue'

// Modals
import DonateEventMaterialsModal from '../components/Modals/DonateEventMaterialsModal.vue'
import ThankYouDonationModal from '../components/Modals/ThankYouDonationModal.vue'
import EditEventModal from '../components/Modals/EditEventModal.vue'

import { supabase } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { events, fetchEvents, fetchEventById, loading, updateEvent } = useEvents()
const { selectedSort } = useSort()

const currentUserId = ref<string | null>(null)

// Route detection for detail mode vs grid mode
const eventId = computed(() => route.params.id as string | undefined)

// Detail View State
const eventDetail = ref<EventItem | null>(null)
const detailError = ref<string | null>(null)
const isDonateModalOpen = ref(false)
const isThankYouModalOpen = ref(false)
const isEditModalOpen = ref(false)

const donatePrefillName = ref('')

// Grid View State
const userLocation = ref<{ lat: number; lng: number } | null>(null)
const categories = [
  { label: 'All', value: '' },
  { label: 'Volunteering', value: 'Volunteering' },
  { label: 'Fundraiser', value: 'Fundraiser' },
  { label: 'Workshop', value: 'Workshop' },
  { label: 'Clean-up', value: 'Clean-up' },
  { label: 'Gardening', value: 'Gardening' },
  { label: 'Crafts & DIY', value: 'Crafts & DIY' },
]

const activeCategory = computed(() => (route.query.category as string) || '')

function setCategory(value: string) {
  router.push({ path: '/events', query: value ? { category: value } : {} })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const filteredEvents = computed(() => {
  let result = events.value
  const selected = activeCategory.value.trim().toLowerCase()

  if (selected && selected !== 'all' && selected !== 'all categories') {
    result = result.filter((e) => {
      const eventCat = e.category?.trim().toLowerCase() || ''
      return eventCat.includes(selected) || selected.includes(eventCat)
    })
  }

  if (selectedSort.value) {
    result = [...result].sort((a, b) => {
      switch (selectedSort.value) {
        case 'New':
          return new Date((b as any).created_at || (b as any).schedule || 0).getTime() - new Date((a as any).created_at || (a as any).schedule || 0).getTime()
        case 'Hot':
          return ((b as any).fulfillment_percent || (b as any).likes_count || 0) - ((a as any).fulfillment_percent || (a as any).likes_count || 0)
        case 'Nearest': {
          if (!userLocation.value) return 0
          const latA = (a as any).latitude ?? (a as any).lat
          const lngA = (a as any).longitude ?? (a as any).lng ?? (a as any).lon
          const latB = (b as any).latitude ?? (b as any).lat
          const lngB = (b as any).longitude ?? (b as any).lng ?? (b as any).lon

          const distA = (latA != null && lngA != null) ? calculateDistance(userLocation.value.lat, userLocation.value.lng, Number(latA), Number(lngA)) : Number((a as any).distance) || Infinity
          const distB = (latB != null && lngB != null) ? calculateDistance(userLocation.value.lat, userLocation.value.lng, Number(latB), Number(lngB)) : Number((b as any).distance) || Infinity
          return distA - distB
        }
        default:
          return 0
      }
    })
  }

  return result
})

async function loadPageData() {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || null

  if (eventId.value) {
    // Single Event Detail Mode
    detailError.value = null
    try {
      const data = await fetchEventById(eventId.value)
      if (!data) {
        detailError.value = 'Event not found or has been removed.'
      } else {
        eventDetail.value = data
      }
    } catch (err: any) {
      detailError.value = err.message || 'Failed to load event details.'
    }
  } else {
    // Grid List Mode
    eventDetail.value = null
    fetchEvents()
  }
}

function handleOpenDonateModal(materialName?: string) {
  if (typeof materialName === 'string') {
    donatePrefillName.value = materialName
  } else {
    donatePrefillName.value = ''
  }
  isDonateModalOpen.value = true
}

const thankYouDetails = ref({
  quantity: 0,
  materialName: '',
  projectName: '',
  authorUsername: ''
})

async function handleDonationSubmitted(payload: { pledgeId: string; quantity: number; materialName: string }) {
  if (!eventDetail.value) return

  await loadPageData()

  thankYouDetails.value = {
    quantity: payload.quantity,
    materialName: payload.materialName,
    projectName: eventDetail.value.event_title,
    authorUsername: eventDetail.value.organizer?.name || 'Campaign Organizer'
  }

  isDonateModalOpen.value = false
  isThankYouModalOpen.value = true
}

async function handleEditEvent(payload: { event: any; materials: any[] }) {
  if (!eventDetail.value?.id) return
  
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

  const result = await updateEvent(String(eventDetail.value.id), {
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
    await loadPageData()
  } else {
    alert('Failed to update event: ' + result.error)
  }
}

function openEventDetail(id: string) {
  router.push(`/events/${id}`)
}

onMounted(() => {
  loadPageData()

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      () => {
        userLocation.value = { lat: 9.3068, lng: 123.3054 }
      }
    )
  }
})

watch(
  () => route.params.id,
  () => {
    loadPageData()
  }
)
</script>

<template>
  <!-- 1. SINGLE EVENT DETAIL VIEW -->
  <template v-if="eventId">
    <div v-if="loading" class="state-card">Loading event details...</div>

    <div v-else-if="detailError" class="state-card error">
      <p>{{ detailError }}</p>
      <button class="btn-back" @click="router.push('/events')">← Back to Events</button>
    </div>

    <PageLayout v-else-if="eventDetail">
      <template #main>
        <BackButton to="/events" label="Back to Events" />

        <div class="event-details-content">
          <div v-if="currentUserId && currentUserId === eventDetail.author_id" class="owner-actions">
            <button class="btn-edit-event" @click="isEditModalOpen = true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              Edit Event Details
            </button>
          </div>
          <EventHero :event="eventDetail" @open-donate="handleOpenDonateModal" />
          <EventStats :stats="eventDetail.stats" />

          <div class="card about-card">
            <h3>About This Project</h3>
            <p class="description-text">{{ eventDetail.description }}</p>
          </div>

          <MaterialsNeededCard :materials="eventDetail.materials_needed" @open-donate="handleOpenDonateModal" />
          <RecentDonationsCard :pledges="eventDetail.recent_pledges" />
        </div>
      </template>

      <template #sidebar>
        <div v-if="eventDetail.organizer" class="card organizer-card">
          <h4>Campaign Organizer</h4>
          <div class="organizer-info">
            <img :src="eventDetail.organizer.avatar" :alt="eventDetail.organizer.name" class="organizer-avatar" />
            <div>
              <strong>{{ eventDetail.organizer.name }}</strong>
              <p v-if="eventDetail.organizer.bio" class="organizer-bio">{{ eventDetail.organizer.bio }}</p>
            </div>
          </div>
        </div>

        <DonorsLeaderboard :donors="eventDetail.top_donors" />
        <RelatedEventsCard :events="eventDetail.related_events" />
      </template>
    </PageLayout>

    <!-- Modals -->
    <EditEventModal
      v-model="isEditModalOpen"
      :initial-data="eventDetail"
      @publish="handleEditEvent"
    />
    <DonateEventMaterialsModal
      v-if="eventDetail"
      v-model="isDonateModalOpen"
      :post-id="String(eventDetail.id || '')"
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
  </template>

  <!-- 2. ALL EVENTS LIST GRID VIEW -->
  <template v-else>
    <CategoryBar />

    <nav class="events-categories">
      <button
        v-for="cat in categories"
        :key="cat.label"
        class="category-pill"
        :class="{ 'category-pill--active': activeCategory === cat.value }"
        @click="setCategory(cat.value)"
      >
        {{ cat.label }}
      </button>
    </nav>

    <PageLayout>
      <template #main>
        <div class="events-list-page">
          <h2>Community Events</h2>

          <div v-if="filteredEvents.length === 0" class="not-found-state">
            <p>No events found{{ activeCategory ? ` in "${activeCategory}"` : '' }}.</p>
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
/* Grid View Styles */
.events-categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-pill {
  padding: 8px 20px;
  border-radius: 24px;
  border: 1.5px solid transparent;
  background: #f0f2ef;
  color: #3f463f;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-pill:hover {
  background: #e4e7e3;
}

.category-pill--active {
  background: #778732;
  color: #ffffff;
}

.events-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.events-list-page h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1d1a;
  margin: 0;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
}

.not-found-state {
  text-align: center;
  padding: 48px 16px;
  color: #525a52;
}

/* Detail View Styles */
.event-details-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.card,
.organizer-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  padding: 20px;
}

.about-card h3, .organizer-card h4 {
  margin: 0 0 12px;
  font-family: 'Outfit', sans-serif;
  color: #1a1d1a;
}

.description-text {
  color: #3f463f;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.organizer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.organizer-bio {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8f9a8f;
}

.state-card {
  max-width: 600px;
  margin: 80px auto;
  padding: 32px;
  text-align: center;
  color: #666;
}

.state-card.error {
  color: #d32f2f;
}

.btn-back {
  margin-top: 16px;
  padding: 8px 16px;
  background: #778732;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>
"""

with open('ecoloop-web/src/views/EventsView.vue', 'w') as f:
    f.write(content)
