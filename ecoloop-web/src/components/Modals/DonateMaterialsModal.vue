<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { supabase } from '../../composables/useAuth'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// --- Vite Leaflet Icon Fix ---
// Vite sometimes breaks default leaflet marker paths. This fixes it automatically.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})
// -----------------------------

interface PledgeItemDraft {
  material_name: string
  quantity: number
  unit: string
}

const props = defineProps<{
  postId: string
}>()

const isOpen = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  (e: 'submitted', payload: { pledgeId: string; quantity: number; materialName: string }): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// --- Map State ---
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const isMapExpanded = ref(false)

// Synchronize state with native HTML dialog methods
watch(isOpen, async (open) => {
  if (open) {
    dialogRef.value?.showModal()
    // Wait for the dialog to actually render in the DOM before injecting the map
    await nextTick()
    setTimeout(() => initMap(), 100)
  } else {
    dialogRef.value?.close()
    // Cleanup map when closed to prevent memory leaks
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      markerInstance = null
    }
  }
})

function toggleMapExpand() {
  isMapExpanded.value = !isMapExpanded.value

  // Leaflet needs to recalculate tile loading when the container size changes
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.invalidateSize()
    }
  }, 100) // slight delay allows the CSS resize to finish first
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) {
    isOpen.value = false
  }
}

// Initialize Leaflet Map
// Initialize Leaflet Map
function initMap() {
  if (!mapContainer.value || mapInstance) return

  // 1. Set your default coordinates here (Example: Talisay, Cebu)
  const defaultLat = 9.3068
    const defaultLng = 123.3054

    // Set zoom level to 13 (good for viewing the city level)
    mapInstance = L.map(mapContainer.value).setView([defaultLat, defaultLng], 13)

  // Load OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance)

  // Listen for clicks to drop a pin
  mapInstance.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    latitude.value = lat
    longitude.value = lng

    if (!markerInstance) {
      markerInstance = L.marker([lat, lng]).addTo(mapInstance!)
    } else {
      markerInstance.setLatLng([lat, lng])
    }
  })
}

// Form State
const title = ref('')
const description = ref('')
const pickupPreference = ref<'deliver' | 'pickup' | 'community'>('deliver')
const locationAddress = ref('') // Text address

const items = ref<PledgeItemDraft[]>([
  { material_name: '', quantity: 1, unit: 'units' }
])

function addItem() {
  items.value.push({ material_name: '', quantity: 1, unit: 'units' })
}

function removeItem(index: number) {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  }
}

function incrementItemQty(index: number) {
  items.value[index].quantity++
}

function decrementItemQty(index: number) {
  if (items.value[index].quantity > 1) {
    items.value[index].quantity--
  }
}

async function handleSubmit() {
  errorMessage.value = null

  if (!props.postId || props.postId === 'undefined') {
      errorMessage.value = 'Error: Invalid Post ID. Are you using mock data?'
      console.error('Invalid postId:', props.postId)
      return
    }

  const validItems = items.value.filter((i) => i.material_name.trim() !== '')
  if (validItems.length === 0) {
    errorMessage.value = 'Please provide at least one material name.'
    return
  }

  if (!title.value.trim()) {
    errorMessage.value = 'Please provide a donation title.'
    return
  }

  try {
    isSubmitting.value = true

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      errorMessage.value = 'You must be logged in to submit a donation.'
      return
    }

    // 2. Insert master pledge WITH Coordinates!
    const { data: pledge, error: pledgeError } = await supabase
      .from('pledges')
      .insert({
        post_id: props.postId,
        donor_id: session.user.id,
        title: title.value,
        description: description.value,
        pickup_preference: pickupPreference.value,
        location_address: locationAddress.value,
        latitude: latitude.value,    // Added
        longitude: longitude.value,  // Added
        status: 'pending'
      })
      .select('id')
      .single()

    if (pledgeError || !pledge) {
      throw new Error(pledgeError?.message || 'Failed to initialize pledge.')
    }

    // 3. Insert line items
    const payloadItems = validItems.map((item) => ({
      pledge_id: pledge.id,
      material_name: item.material_name.trim(),
      quantity: item.quantity,
      unit: item.unit.trim() || 'units'
    }))

    const { error: itemsError } = await supabase
      .from('pledge_items')
      .insert(payloadItems)

    if (itemsError) throw new Error(itemsError.message)

    const totalQty = validItems.reduce((acc, curr) => acc + curr.quantity, 0)
    const summaryName = validItems.length === 1
      ? validItems[0].material_name
      : `${validItems[0].material_name} +${validItems.length - 1} more`

    // Reset Form
    title.value = ''
    description.value = ''
    locationAddress.value = ''
    latitude.value = null
    longitude.value = null
    items.value = [{ material_name: '', quantity: 1, unit: 'units' }]

    emit('submitted', { pledgeId: pledge.id, quantity: totalQty, materialName: summaryName })
    isOpen.value = false
  } catch (err: any) {
    errorMessage.value = err.message || 'An unexpected error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="modal-backdrop"
      @cancel="isOpen = false"
      @click="handleBackdropClick"
    >
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <h2>Donate Materials</h2>
          </div>
          <button class="close-btn" @click="isOpen = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="divider"></div>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <!-- Body Form Grid -->
        <div class="form-grid">
          <!-- Left Column: Material Line Items -->
          <div class="form-column">
            <div class="section-label-row">
              <label class="form-label">Materials Offered</label>
              <button type="button" class="add-row-btn" @click="addItem">
                + Add Item
              </button>
            </div>

            <div class="items-scroll-list">
              <div v-for="(item, idx) in items" :key="idx" class="item-row">
                <div class="item-inputs">
                  <input
                    v-model="item.material_name"
                    type="text"
                    class="form-input material-input"
                    placeholder="Material name (e.g., Glass Bottles)"
                  />
                  <div class="qty-unit-group">
                    <div class="quantity-picker mini">
                      <button type="button" class="qty-btn" @click="decrementItemQty(idx)">-</button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button type="button" class="qty-btn" @click="incrementItemQty(idx)">+</button>
                    </div>
                    <input
                      v-model="item.unit"
                      type="text"
                      class="form-input unit-input"
                      placeholder="Unit (pcs, kg)"
                    />
                  </div>
                </div>
                <button
                  v-if="items.length > 1"
                  type="button"
                  class="delete-item-btn"
                  @click="removeItem(idx)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Donation Title</label>
              <input v-model="title" type="text" class="form-input" placeholder="e.g., Clean bottles from warehouse" />
            </div>

            <div class="form-group">
              <label class="form-label">Description of Materials</label>
              <textarea v-model="description" class="form-textarea" placeholder="Describe the condition, cleanliness, or batch details..."></textarea>
            </div>
          </div>

          <!-- Right Column: Logistics & Location -->
          <div class="form-column">

            <!-- Map & Location Section (Duplicates Removed!) -->
            <div class="form-group map-group">
              <div class="section-label-row">
                <label class="form-label">Drop-off / Pickup Location</label>
                <span v-if="latitude" class="text-hint" style="color:#778732; font-size: 0.8rem;">Pin dropped!</span>
                <span v-else class="text-hint" style="color:#6b7280; font-size: 0.8rem;">Click map to drop a pin</span>
              </div>

              <!-- Leaflet Map Container -->
              <div class="map-wrapper" :class="{ 'is-expanded': isMapExpanded }">
                              <!-- Leaflet Map Container -->
                              <div ref="mapContainer" class="map-preview"></div>

                              <!-- Floating Enlarge/Shrink Button -->
                              <button type="button" class="expand-map-btn" @click.prevent="toggleMapExpand" title="Toggle Fullscreen">
                                <!-- Expand Icon -->
                                <svg v-if="!isMapExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                                </svg>
                                <!-- Shrink Icon -->
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>
                                </svg>
                              </button>
                            </div>

              <div class="location-address">
                <!-- Fixed SVG Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <input v-model="locationAddress" type="text" class="form-input location-input" placeholder="Type specific address details (optional)..." />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Pickup Preferences</label>
              <div class="radio-group">
                <label class="radio-option" :class="{ active: pickupPreference === 'deliver' }">
                  <input type="radio" v-model="pickupPreference" value="deliver" class="sr-only" />
                  <span class="radio-dot"></span>
                  <span class="option-label">I can deliver</span>
                </label>

                <label class="radio-option" :class="{ active: pickupPreference === 'pickup' }">
                  <input type="radio" v-model="pickupPreference" value="pickup" class="sr-only" />
                  <span class="radio-dot"></span>
                  <span class="option-label">Pickup from my location</span>
                </label>

                <label class="radio-option" :class="{ active: pickupPreference === 'community' }">
                  <input type="radio" v-model="pickupPreference" value="community" class="sr-only" />
                  <span class="radio-dot"></span>
                  <span class="option-label">Meet at community center</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button type="button" class="submit-btn" :disabled="isSubmitting" @click="handleSubmit">
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Confirm Donation</span>
          </button>
          <button type="button" class="cancel-btn" :disabled="isSubmitting" @click="isOpen = false">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  margin: auto;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  max-width: 900px;
  width: 95%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-backdrop::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-container {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.icon-box {
  background: #f0f4ea;
  padding: 6px;
  border-radius: 6px;
  display: flex;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.divider {
  height: 1px;
  background: #e5e7eb;
}

.error-banner {
  background: #fef2f2;
  color: #b91c1c;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.add-row-btn {
  background: none;
  border: none;
  color: #778732;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.add-row-btn:hover {
  background: #f0f4ea;
}

.text-btn {
  background: none;
  border: none;
  color: #778732;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
}

.text-btn:hover {
  text-decoration: underline;
}

.items-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.item-inputs {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
}

.material-input {
  flex: 2;
  min-width: 120px;
}

.qty-unit-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1.5;
}

.unit-input {
  flex: 1;
  min-width: 60px;
}

.quantity-picker.mini {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 4px;
  background: white;
  height: 35px;
}

.qty-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 8px;
  font-weight: bold;
  color: #374151;
}

.qty-btn:hover {
  background: #f3f4f6;
  border-radius: 4px;
}

.qty-val {
  min-width: 24px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.delete-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 6px;
  width: 35px;
  height: 35px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.delete-item-btn:hover {
  background: #fca5a5;
  color: #b91c1c;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.map-group {
  gap: 10px;
}

.map-preview {
  width: 100%;
  height: 200px; /* Increased from 120px */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.map-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.location-address {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-input {
  flex: 1;
}

.form-input, .form-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  box-sizing: border-box;
  height: 35px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  height: auto;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #778732;
  box-shadow: 0 0 0 1px #778732;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  background: #f9fafb;
}

.radio-option.active {
  border-color: #778732;
  background: #fbfdf9;
}

.radio-dot {
  width: 14px;
  height: 14px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  position: relative;
}

.radio-option.active .radio-dot {
  border-color: #778732;
}

.radio-option.active .radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #778732;
  border-radius: 50%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.submit-btn {
  background: #778732;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #627228;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Custom Map Enlarge Styles --- */
.map-wrapper {
  position: relative;
  width: 100%;
}

.expand-map-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000; /* Must be 1000 to sit above Leaflet tiles */
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

.expand-map-btn:hover {
  background: #f3f4f6;
}

/* Fullscreen state overrides */
.map-wrapper.is-expanded {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999; /* Sit on top of the modal backdrop */
  background: white;
}

.map-wrapper.is-expanded .map-preview {
  height: 100vh;
  border-radius: 0;
  border: none;
}

</style>
