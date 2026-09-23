<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Calendar, X, ChevronDown, Camera, ChevronRight } from 'lucide-vue-next'
import RequestMaterialsModal from './RequestMaterialsModal.vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
// -----------------------------

const isOpen = defineModel<boolean>({ default: false })
const dialogRef = ref<HTMLDialogElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isMaterialsModalOpen = ref(false)
const draftEventData = ref<any>({})

const emit = defineEmits<{
  (e: 'publish', payload: { event: any; materials: any[] }): void
}>()

// Blank initial form state
const formData = ref({
  title: '',
  description: '',
  category: '',
  bannerImage: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  latitude: null as number | null,
  longitude: null as number | null,
  organizer: ''
})

const categories = [
  'Composting',
  'Clean-Up Drive',
  'Recycling Workshop',
  'Upcycling Event',
  'Tree Planting'
]

// --- Map State & Logic ---
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null
const isMapExpanded = ref(false)

function toggleMapExpand() {
  isMapExpanded.value = !isMapExpanded.value
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 100)
}

watch(isOpen, async (open) => {
  if (open) {
    dialogRef.value?.showModal()

    // Wait for the dialog to render before mounting the map
    await nextTick()
    setTimeout(() => initMap(), 100)
  } else {
    dialogRef.value?.close()

    // Cleanup map on close
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      markerInstance = null
    }
  }
}, { immediate: true })

function initMap() {
  if (!mapContainer.value || mapInstance) return

  // Default coordinates (Dumaguete)
  const defaultLat = 9.3068
  const defaultLng = 123.3054

  const startLat = formData.value.latitude || defaultLat
  const startLng = formData.value.longitude || defaultLng

  mapInstance = L.map(mapContainer.value).setView([startLat, startLng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  // Put a pin if we already have coordinates
  if (formData.value.latitude && formData.value.longitude) {
    markerInstance = L.marker([formData.value.latitude, formData.value.longitude]).addTo(mapInstance)
  }

  // Update formData when the user clicks the map!
  mapInstance.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    formData.value.latitude = lat
    formData.value.longitude = lng

    if (!markerInstance) {
      markerInstance = L.marker([lat, lng]).addTo(mapInstance!)
    } else {
      markerInstance.setLatLng([lat, lng])
    }
  })
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) {
    isOpen.value = false
  }
}

// --- Image Handling ---
function triggerFileInput() {
  fileInputRef.value?.click()
}

const selectedFile = ref<File | null>(null)

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]

    // 1. Save the RAW file object to upload later
    selectedFile.value = file

    // 2. Keep the blob ONLY for the UI preview in this modal
    formData.value.bannerImage = URL.createObjectURL(file)
  }
}

function removeBanner() {
  formData.value.bannerImage = ''
  // Clear the raw file if they remove the image
  selectedFile.value = null
}

function handleSubmit() {
  // Attach the rawFile to the draft data so it gets passed to the next modal
  draftEventData.value = {
    ...formData.value,
    rawFile: selectedFile.value
  }

  isOpen.value = false
  isMaterialsModalOpen.value = true
}

function handleMaterialsPublish(payload: { event: any; materials: any[] }) {
  emit('publish', payload)
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
      <div class="create-event-modal-card">
        <div class="header-row">
          <div class="title-group">
            <div class="header-icon-wrap">
              <Calendar :size="20" color="#778732" />
            </div>
            <h2 class="create-new-event-title">Create New Event</h2>
          </div>
          <button type="button" class="btn-close" @click="isOpen = false">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-line"></div>

        <form @submit.prevent="handleSubmit" class="form-columns">
          <!-- Left Column -->
          <div class="left-column">
            <div class="form-group">
              <label for="event-title" class="field-label">Event Title</label>
              <input
                id="event-title"
                v-model="formData.title"
                type="text"
                class="input-box"
                placeholder="Enter event title"
                required
              />
            </div>

            <div class="form-group">
              <label for="event-description" class="field-label">Event Description</label>
              <textarea
                id="event-description"
                v-model="formData.description"
                class="textarea-box"
                placeholder="Describe your event..."
                rows="3"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label for="event-category" class="field-label">Event Category</label>
              <div class="select-wrapper">
                <select
                  id="event-category"
                  v-model="formData.category"
                  class="dropdown-trigger"
                  required
                >
                  <option value="" disabled selected>Select a category</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
                <ChevronDown :size="16" class="dropdown-chevron" />
              </div>
            </div>

            <div class="form-group">
              <span class="field-label">Banner Image</span>
              <div class="photo-grid">
                <button
                  type="button"
                  class="upload-target-box"
                  @click="triggerFileInput"
                >
                  <Camera :size="24" color="#8F9A8F" />
                  <span class="upload-label">Upload Banner Image</span>
                </button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file-input"
                  @change="handleFileUpload"
                />

                <div v-if="formData.bannerImage" class="uploaded-thumbnail-container">
                  <img :src="formData.bannerImage" alt="Banner Preview" class="thumbnail-img" />
                  <button
                    type="button"
                    class="btn-delete-photo"
                    @click="removeBanner"
                    title="Remove Image"
                  >
                    <X :size="10" color="#FFFFFF" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="right-column">
            <div class="form-group">
              <label for="event-date" class="field-label">Event Date</label>
              <input
                id="event-date"
                v-model="formData.date"
                type="date"
                class="input-box"
                required
              />
            </div>

            <div class="time-fields-row">
              <div class="form-group flex-1">
                <label for="start-time" class="field-label">Start Time</label>
                <input
                  id="start-time"
                  v-model="formData.startTime"
                  type="time"
                  class="input-box"
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label for="end-time" class="field-label">End Time</label>
                <input
                  id="end-time"
                  v-model="formData.endTime"
                  type="time"
                  class="input-box"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="event-location" class="field-label">Location</label>
              <input
                id="event-location"
                v-model="formData.location"
                type="text"
                class="input-box"
                placeholder="Street Address, City, State"
                required
              />

              <!-- Leaflet Map Container -->
              <div class="map-wrapper" :class="{ 'is-expanded': isMapExpanded }">
                <div ref="mapContainer" class="map-preview"></div>

                <!-- Floating Enlarge/Shrink Button -->
                <button type="button" class="expand-map-btn" @click.prevent="toggleMapExpand" title="Toggle Fullscreen">
                  <svg v-if="!isMapExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>
                  </svg>
                </button>
              </div>

              <!-- Helpful prompt -->
              <p v-if="!formData.latitude" style="font-size: 12px; color: #8F9A8F; margin-top: 6px; margin-bottom: 0;">
                Tap on the map to drop a pin for the exact location.
              </p>
            </div>

            <div class="form-group">
              <label for="event-organizer" class="field-label">Organizer</label>
              <input
                id="event-organizer"
                v-model="formData.organizer"
                type="text"
                class="input-box"
                placeholder="Organizer or Organization name"
                required
              />
            </div>
          </div>
        </form>

        <div class="action-group">
          <button type="button" class="btn-submit" @click="handleSubmit">
            <span>Next: Request Materials</span>
            <ChevronRight :size="18" color="#FFFFFF" />
          </button>
          <button type="button" class="btn-cancel" @click="isOpen = false">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>

  <RequestMaterialsModal
    v-model="isMaterialsModalOpen"
    :event-details="draftEventData"
    @publish="handleMaterialsPublish"
  />
</template>

<style scoped>
.modal-backdrop {
  border: none;
  padding: 0;
  background: transparent;
  max-width: 100vw;
  max-height: 100vh;
}
.modal-backdrop::backdrop { background: rgba(0, 0, 0, 0.4); }
.create-event-modal-card {
  width: 740px;
  padding: 28px;
  background: #ffffff;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}
.header-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-group { display: flex; align-items: center; gap: 10px; }
.header-icon-wrap {
  padding: 8px;
  background: rgba(119, 135, 50, 0.10);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.create-new-event-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 22px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  line-height: 1.2;
}
.btn-close { width: 36px; height: 32px; background: #F7F8F6; border: none; border-radius: 18px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: background-color 0.2s ease; }
.btn-close:hover { background: #E4E7E3; }
.header-line { width: 100%; height: 1px; background-color: #E4E7E3; }
.form-columns { width: 100%; display: flex; gap: 24px; }
.left-column, .right-column { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.field-label { color: #1A1D1A; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 600; }
.input-box { width: 100%; padding: 12px 16px; background: #F7F8F6; border: 1px solid #E4E7E3; border-radius: 8px; color: #1A1D1A; font-size: 14px; font-family: 'Geist', sans-serif; font-weight: 400; box-sizing: border-box; outline: none; transition: border-color 0.2s ease; }
.input-box:focus { border-color: #778732; }
.textarea-box { width: 100%; height: 80px; padding: 12px 16px; background: #F7F8F6; border: 1px solid #E4E7E3; border-radius: 8px; color: #1A1D1A; font-size: 14px; font-family: 'Geist', sans-serif; font-weight: 400; line-height: 1.5; box-sizing: border-box; outline: none; resize: none; transition: border-color 0.2s ease; }
.textarea-box:focus { border-color: #778732; }
.select-wrapper { position: relative; width: 100%; }
.dropdown-trigger { width: 100%; padding: 12px 16px; background: #F7F8F6; border: 1.5px solid #778732; border-radius: 8px; color: #1A1D1A; font-size: 15px; font-family: 'Outfit', sans-serif; font-weight: 600; appearance: none; outline: none; cursor: pointer; }
.dropdown-chevron { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #778732; }
.photo-grid { display: flex; gap: 12px; width: 100%; }
.upload-target-box { flex: 1; height: 96px; padding: 16px; background: #F7F8F6; border: 1px solid #E4E7E3; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; cursor: pointer; transition: background-color 0.2s ease, border-color 0.2s ease; }
.upload-target-box:hover { background: #EEF0EC; border-color: #778732; }
.upload-label { text-align: center; color: #8F9A8F; font-size: 11px; font-family: 'Geist', sans-serif; font-weight: 500; }
.hidden-file-input { display: none; }
.uploaded-thumbnail-container { flex: 1; height: 96px; position: relative; overflow: hidden; border-radius: 8px; }
.thumbnail-img { width: 100%; height: 100%; object-fit: cover; }
.btn-delete-photo { width: 20px; height: 20px; position: absolute; top: 6px; right: 6px; background: rgba(26, 29, 26, 0.80); border: none; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; }
.time-fields-row { display: flex; gap: 12px; width: 100%; }
.flex-1 { flex: 1; }
.action-group { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.btn-submit { width: 100%; padding: 14px 0; background: #778732; border: none; border-radius: 24px; display: flex; justify-content: center; align-items: center; gap: 8px; color: #ffffff; font-size: 16px; font-family: 'Outfit', sans-serif; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
.btn-submit:hover { background: #65732A; }
.btn-cancel { background: transparent; border: none; color: #8F9A8F; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 600; text-decoration: underline; cursor: pointer; }
.btn-cancel:hover { color: #1A1D1A; }

/* Map Enlarge Styles */
.map-wrapper {
  position: relative;
  width: 100%;
  margin-top: 8px;
}

.map-preview {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #E4E7E3;
  z-index: 1;
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

.expand-map-btn:hover {
  background: #f3f4f6;
}

/* Fullscreen Mode Classes */
.map-wrapper.is-expanded {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  background: white;
  margin-top: 0;
}

.map-wrapper.is-expanded .map-preview {
  height: 100vh;
  border-radius: 0;
  border: none;
}
</style>
