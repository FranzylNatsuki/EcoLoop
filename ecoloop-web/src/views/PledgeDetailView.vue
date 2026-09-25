<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../composables/useAuth'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BackButton from '../components/common/BackButton.vue'

// --- Vite Leaflet Icon Fix ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

const route = useRoute()
const router = useRouter()

const pledge = ref<any>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const errorMessage = ref<string | null>(null)
const currentUserId = ref<string | null>(null)

// --- Rating State ---
const myRating = ref(0)
const hoverRating = ref(0)
const isSubmittingRating = ref(false)

// --- Inline Confirmation Modal State ---
const confirmDialog = ref({
  isOpen: false,
  action: '' as 'confirmed' | 'completed' | 'cancelled',
  title: '',
  message: '',
  confirmText: '',
  btnClass: ''
})

// --- Map State ---
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
const isMapExpanded = ref(false)

const isPostAuthor = computed(() => {
  return currentUserId.value && pledge.value?.post?.author_id === currentUserId.value
})

const fetchPledgeDetails = async (id: string) => {
  if (!id) return
  isLoading.value = true
  errorMessage.value = null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    currentUserId.value = session?.user.id || null

    const { data, error } = await supabase
      .from('pledges')
      .select(`
        *,
        donor:profiles!pledges_donor_id_fkey(full_name, email, contact_number),
        post:cause_requests!pledges_post_id_fkey(title, author_id),
        items:pledge_items(*),
        images:pledge_images(image_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    pledge.value = data

    // --- Fetch existing rating if applicable ---
    const rateeId = isPostAuthor.value
      ? pledge.value.donor_id
      : (currentUserId.value === pledge.value.donor_id ? pledge.value.post?.author_id : null)

    if (rateeId && currentUserId.value) {
      const { data: ratingData } = await supabase
        .from('user_ratings')
        .select('score')
        .eq('rater_id', currentUserId.value)
        .eq('ratee_id', rateeId)
        .maybeSingle() // Prevents the 406 error if it doesn't exist yet!

      if (ratingData) {
        myRating.value = ratingData.score
      }
    }

    // --- Initialize Map ---
    if (pledge.value.latitude && pledge.value.longitude) {
      setTimeout(() => {
        initMap(pledge.value.latitude, pledge.value.longitude)
      }, 150)
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to load pledge details.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const routeId = route.params.id
  if (typeof routeId === 'string') fetchPledgeDetails(routeId)
  else if (Array.isArray(routeId) && routeId[0]) fetchPledgeDetails(routeId[0])
  else {
    errorMessage.value = 'A pledge ID was not provided.'
    isLoading.value = false
  }
})

// --- Submit Rating Logic ---
async function submitRating(score: number) {
  const rateeId = isPostAuthor.value
    ? pledge.value?.donor_id
    : (currentUserId.value === pledge.value?.donor_id ? pledge.value?.post?.author_id : null)

  if (!currentUserId.value || isSubmittingRating.value || !rateeId) return

  isSubmittingRating.value = true
  myRating.value = score

  try {
    const { error } = await supabase
      .from('user_ratings')
      .upsert({
        rater_id: currentUserId.value,
        ratee_id: rateeId,
        score: score
      }, {
        onConflict: 'rater_id, ratee_id'
      })

    if (error) throw error
  } catch (err: any) {
    console.error("Failed to submit rating:", err.message)
    alert("Could not save rating.")
  } finally {
    isSubmittingRating.value = false
  }
}

// --- Formatter for Pickup Preference ---
const getPreferenceLabel = (pref: string) => {
  if (pref === 'deliver') return 'I can deliver'
  if (pref === 'pickup') return 'Pickup from my location'
  if (pref === 'community') return 'Meet at community center'
  return pref
}

// --- Map Toggle ---
function toggleMapExpand() {
  isMapExpanded.value = !isMapExpanded.value
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 250)
}

// --- Modal Request Handler ---
const requestStatusUpdate = (action: 'confirmed' | 'completed' | 'cancelled') => {
  if (action === 'confirmed') {
    confirmDialog.value = {
      isOpen: true, action,
      title: 'Confirm Donation',
      message: 'Are you sure you want to accept and confirm this donation? You will need to coordinate with the donor for handover.',
      confirmText: 'Yes, Confirm Donation',
      btnClass: 'btn-confirm-accept'
    }
  } else if (action === 'cancelled') {
    confirmDialog.value = {
      isOpen: true, action,
      title: 'Decline Donation',
      message: 'Are you sure you want to decline these materials? This action will cancel the pledge and cannot be undone.',
      confirmText: 'Yes, Decline',
      btnClass: 'btn-confirm-reject'
    }
  } else if (action === 'completed') {
    confirmDialog.value = {
      isOpen: true, action,
      title: 'Confirm Delivery',
      message: 'Have you successfully received the materials? Confirming this will officially close this pledge.',
      confirmText: 'Yes, Items Received',
      btnClass: 'btn-confirm-complete'
    }
  }
}

// --- Execute DB Update ---
const executeStatusUpdate = async () => {
  if (!pledge.value) return

  const newStatus = confirmDialog.value.action
  isUpdating.value = true
  confirmDialog.value.isOpen = false

  try {
    const { error } = await supabase
      .from('pledges')
      .update({ status: newStatus })
      .eq('id', pledge.value.id)

    if (error) throw error

    pledge.value.status = newStatus
  } catch (err: any) {
    console.error('Failed to update status:', err.message)
    alert('Failed to update pledge status. Check database enum values.')
  } finally {
    isUpdating.value = false
  }
}

function initMap(lat: number, lng: number) {
  if (!mapContainer.value) return

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  mapInstance = L.map(mapContainer.value).setView([lat, lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  L.marker([lat, lng]).addTo(mapInstance)

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 250)
}

function goBack() {
  router.back()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

watch(
  () => route.params.id,
  (newId) => {
    if (route.name !== 'pledgedetail') return
    const id = Array.isArray(newId) ? newId[0] : newId
    if (typeof id === 'string' && id.length > 0) fetchPledgeDetails(id)
  }
)
</script>

<template>
  <div class="pledge-detail-page">
    <div v-if="isLoading" class="loading-state">Loading pledge details...</div>

    <div v-else-if="errorMessage" class="error-state">
      <p>{{ errorMessage }}</p>
      <button @click="goBack" class="back-btn">Go Back</button>
    </div>

    <div v-else-if="pledge" class="pledge-container">
      <BackButton />

      <div class="page-header">
        <div class="header-titles">
          <span class="status-badge" :class="pledge.status">{{ pledge.status }}</span>
          <h1>{{ pledge.title }}</h1>
          <p class="subtitle">
            Pledged to <strong>{{ pledge.post?.title }}</strong> on {{ formatDate(pledge.created_at) }}
          </p>
        </div>
      </div>

      <div class="content-grid">
        <div class="main-column">
          <div class="card">
            <h3>Donor Information</h3>
            <p><strong>Name:</strong> {{ pledge.donor?.full_name || 'Anonymous' }}</p>
            <p v-if="pledge.description"><strong>Note:</strong> {{ pledge.description }}</p>

            <div v-if="pledge.donor?.email || pledge.donor?.contact_number" class="contact-section">
              <h4 class="contact-heading">Contact the Donor:</h4>
              <div class="contact-links">
                <p v-if="pledge.donor?.email">
                  <strong>Email:</strong>
                  <a :href="`mailto:${pledge.donor.email}`">{{ pledge.donor.email }}</a>
                </p>
                <p v-if="pledge.donor?.contact_number">
                  <strong>Phone:</strong>
                  <a :href="`tel:${pledge.donor.contact_number}`">{{ pledge.donor.contact_number }}</a>
                </p>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Materials Offered</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pledge.items" :key="item.id">
                  <td>{{ item.material_name }}</td>
                  <td>{{ item.quantity }} {{ item.unit }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="pledge.images && pledge.images.length > 0" class="card">
            <h3>Attached Photos</h3>
            <div class="photo-gallery">
              <div v-for="img in pledge.images" :key="img.image_url" class="photo-item">
                <img :src="img.image_url" alt="Donation material photo" />
              </div>
            </div>
          </div>

          <!-- NEW: Rating Card (Visible only when pledge is completed) -->
          <div v-if="pledge.status === 'completed' && (isPostAuthor || currentUserId === pledge.donor_id)" class="card rating-card">
            <h3>{{ isPostAuthor ? 'Rate this Donor' : 'Rate the Organizer' }}</h3>
            <p class="rating-desc">Help keep the community safe and trustworthy by rating your experience.</p>

            <div class="stars-container" @mouseleave="hoverRating = 0">
              <button
                v-for="star in 5"
                :key="star"
                class="star-btn"
                :class="{ 'is-active': star <= (hoverRating || myRating) }"
                :disabled="isSubmittingRating"
                @mouseover="hoverRating = star"
                @click="submitRating(star)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
            <span class="rating-status-text" v-if="myRating > 0">Your rating is saved!</span>
          </div>

        </div>

        <div class="sidebar-column">
          <div class="card logistics-card">
            <h3>Logistics</h3>
            <div class="logistics-detail">
              <span class="label">Preference:</span>
              <span class="value preference-badge">{{ getPreferenceLabel(pledge.pickup_preference) }}</span>
            </div>

            <div v-if="pledge.location_address" class="logistics-detail">
              <span class="label">Address:</span>
              <p class="value">{{ pledge.location_address }}</p>
            </div>

            <!-- Map Container with Expand/Shrink Button -->
            <div v-if="pledge.latitude && pledge.longitude" class="map-wrapper" :class="{ 'is-expanded': isMapExpanded }">
              <div ref="mapContainer" class="static-map"></div>

              <button type="button" class="expand-map-btn" @click.prevent="toggleMapExpand" title="Toggle Fullscreen">
                <svg v-if="!isMapExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="isPostAuthor" class="bottom-actions-container">
        <template v-if="pledge.status === 'pending'">
          <button class="btn-action pill-reject" :disabled="isUpdating" @click="requestStatusUpdate('cancelled')">
            Decline
          </button>
          <button class="btn-action pill-accept" :disabled="isUpdating" @click="requestStatusUpdate('confirmed')">
            {{ isUpdating ? 'Saving...' : 'Confirm Donation' }}
          </button>
        </template>

        <template v-if="pledge.status === 'confirmed'">
          <button class="btn-action pill-complete" :disabled="isUpdating" @click="requestStatusUpdate('completed')">
            Mark as Received
          </button>
        </template>
      </div>

    </div>

    <!-- Inline Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="confirmDialog.isOpen" class="modal-overlay" @click.self="confirmDialog.isOpen = false">
          <div class="confirm-modal">
            <h3>{{ confirmDialog.title }}</h3>
            <p>{{ confirmDialog.message }}</p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="confirmDialog.isOpen = false">Cancel</button>
              <button :class="['btn-confirm', confirmDialog.btnClass]" @click="executeStatusUpdate">
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pledge-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.loading-state, .error-state {
  text-align: center;
  padding: 48px;
  color: #666;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 16px;
}
.page-header h1 {
  margin: 8px 0;
  font-size: 1.8rem;
  color: #1A1D1A;
}
.subtitle {
  color: #666;
  font-size: 0.9rem;
}
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.completed { background: #cce5ff; color: #004085; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 768px) {
  .content-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: 16px; }
}

.card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
  color: #1A1D1A;
}

/* --- Contact Section Styles --- */
.contact-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #eaeaea;
  background: #fdfdfd;
}
.contact-heading {
  font-size: 0.95rem;
  color: #1A1D1A;
  margin-top: 0;
  margin-bottom: 10px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}
.contact-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.contact-links p {
  margin: 0;
}
.contact-links a {
  color: #778732;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}
.contact-links a:hover {
  text-decoration: underline;
  color: #556123;
}
/* --------------------------------- */

.items-table {
  width: 100%;
  border-collapse: collapse;
}
.items-table th, .items-table td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #eaeaea;
}
.items-table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* --- Rating Card Styles --- */
.rating-card {
  text-align: center;
  background: #fdfdfd;
  border: 1px dashed #e4e7e3;
}
.rating-desc {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 16px;
}
.stars-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.star-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #e4e7e3;
  transition: color 0.15s ease, transform 0.1s ease;
}
.star-btn svg {
  width: 32px;
  height: 32px;
}
.star-btn.is-active {
  color: #F59E0B;
}
.star-btn:hover:not(:disabled) {
  transform: scale(1.15);
}
.star-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rating-status-text {
  display: block;
  margin-top: 12px;
  font-size: 0.85rem;
  color: #778732;
  font-weight: 600;
}
/* -------------------------- */


.logistics-detail {
  margin-bottom: 16px;
}
.logistics-detail .label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}
.preference-badge {
  background: #f1f3e9;
  color: #778732;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

/* --- Map Enlarge Styles --- */
.map-wrapper {
  position: relative;
  margin-top: 16px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
}

.expand-map-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 2px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  box-shadow: 0 1px 5px rgba(0,0,0,0.2);
  transition: background 0.2s;
}
.expand-map-btn:hover { background: #f3f4f6; }

.map-wrapper.is-expanded {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  background: white;
  margin: 0;
  border-radius: 0;
  border: none;
}

.map-wrapper.is-expanded .static-map {
  height: 100vh;
}

.static-map {
  width: 100%;
  height: 100%;
  min-height: 200px;
  z-index: 1;
}

/* --- BOTTOM RIGHT PILL ACTIONS --- */
.bottom-actions-container {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid #eaeaea;
}
.btn-action {
  border: none;
  padding: 14px 28px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0,0,0,0.08);
  opacity: 0.95;
}
.btn-action.pill-accept, .btn-action.pill-complete { background: #778732; color: white; }
.btn-action.pill-reject { background: #fee2e2; color: #ef4444; }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

/* --- INLINE CONFIRM MODAL UI --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.confirm-modal {
  background: white;
  width: 100%;
  max-width: 420px;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
.confirm-modal h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #1A1D1A;
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
}
.confirm-modal p {
  color: #666;
  margin-bottom: 28px;
  line-height: 1.6;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-cancel {
  background: #f3f4f6;
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  color: #374151;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #e5e7eb; }

.btn-confirm {
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  transition: opacity 0.2s;
}
.btn-confirm:hover { opacity: 0.9; }
.btn-confirm-accept, .btn-confirm-complete { background: #778732; }
.btn-confirm-reject { background: #ef4444; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
