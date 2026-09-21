<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
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
const pledgeId = route.params.id as string

const pledge = ref<any>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Map State
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null

const fetchPledgeDetails = async (id: string) => {
  if (!id) return
  isLoading.value = true
  errorMessage.value = null

  try {
    const { data, error } = await supabase
      .from('pledges')
      .select(`
        *,
        donor:profiles!pledges_donor_id_fkey(full_name, email),
        post:cause_requests!pledges_post_id_fkey(title),
        items:pledge_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    pledge.value = data

    if (pledge.value.latitude && pledge.value.longitude) {
      await nextTick()
      initMap(pledge.value.latitude, pledge.value.longitude)
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to load pledge details.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  fetchPledgeDetails(route.params.id as string)
})

function initMap(lat: number, lng: number) {
  if (!mapContainer.value) return

  // 1. Destroy existing map instance if navigating between pledges
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  // 2. Initialize new map
  mapInstance = L.map(mapContainer.value).setView([lat, lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance)

  L.marker([lat, lng]).addTo(mapInstance)

  // 3. Force Leaflet to recalculate the grid size after Vue finishes painting the DOM
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.invalidateSize()
    }
  }, 100)
}

function goBack() {
  router.back()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// 4. THE FIX: Watch the route parameter for changes
watch(
  () => route.params.id,
  (newId) => {
    // Only fetch if we are still on the pledge detail page and have a new ID
    if (newId && route.name === 'pledgedetail') {
      fetchPledgeDetails(newId as string)
    }
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
      <!-- Header -->
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
        <!-- Main Content -->
        <div class="main-column">
          <!-- Donor Info -->
          <div class="card">
            <h3>Donor Information</h3>
            <p><strong>Name:</strong> {{ pledge.donor?.full_name || 'Anonymous' }}</p>
            <p v-if="pledge.donor?.email"><strong>Email:</strong> {{ pledge.donor.email }}</p>
            <p v-if="pledge.description"><strong>Note:</strong> {{ pledge.description }}</p>
          </div>

          <!-- Items Table -->
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
        </div>

        <!-- Sidebar / Logistics -->
        <div class="sidebar-column">
          <div class="card logistics-card">
            <h3>Logistics</h3>
            <div class="logistics-detail">
              <span class="label">Preference:</span>
              <span class="value preference-badge">{{ pledge.pickup_preference }}</span>
            </div>

            <div v-if="pledge.location_address" class="logistics-detail">
              <span class="label">Address:</span>
              <p class="value">{{ pledge.location_address }}</p>
            </div>

            <div v-if="pledge.latitude && pledge.longitude" class="map-wrapper">
              <div ref="mapContainer" class="static-map"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pledge-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.back-btn {
  background: none;
  border: none;
  color: #778732;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 16px;
}
.page-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 16px;
}
.page-header h1 {
  margin: 8px 0;
  font-size: 1.8rem;
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
.status-badge.active { background: #d4edda; color: #155724; }
.status-badge.completed { background: #cce5ff; color: #004085; }

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
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
}

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
}

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
  text-transform: capitalize;
}

.map-wrapper {
  margin-top: 16px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
}
.static-map {
  width: 100%;
  height: 100%;
}
</style>
