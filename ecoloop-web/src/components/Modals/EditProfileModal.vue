<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
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

const props = defineProps<{
  modelValue: boolean
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updatedProfile: {
    fullName: string;
    about: string;
    location: string;
    contact: string;
    avatarPreview: string;
    avatarFile: File | null;
    latitude: number | null;
    longitude: number | null;
  }): void
}>()

// Form States
const fullName = ref('')
const about = ref('')
const location = ref('')
const contact = ref('')
const avatarPreview = ref('')
const avatarFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Map States
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null

// Sync initial data when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'

    // Pre-fill the form with current profile data
    if (props.initialData) {
      fullName.value = props.initialData.full_name || ''
      location.value = props.initialData.location || ''
      contact.value = props.initialData.contact_number || ''
      about.value = props.initialData.profile_data?.about || ''
      avatarPreview.value = props.initialData.profile_data?.Avatar || ''
      avatarFile.value = null

      // BULLETPROOF COORDINATE LOADING:
      // 1. Check profiles table first, fallback to profile_data for older accounts
      const rawLat = props.initialData.latitude || props.initialData.profile_data?.latitude
      const rawLng = props.initialData.longitude || props.initialData.profile_data?.longitude

      // 2. Force them to be numbers so Leaflet doesn't crash
      latitude.value = rawLat ? Number(rawLat) : null
      longitude.value = rawLng ? Number(rawLng) : null
    }

    // Give the modal time to mount in the DOM, then init map
    await nextTick()
    setTimeout(() => initMap(), 150)
  } else {
    document.body.style.overflow = ''
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      markerInstance = null
    }
  }
})

// Initialize Leaflet
function initMap() {
  if (!mapContainer.value) return

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    markerInstance = null
  }

  // Default to Dumaguete if no prior location is set
  const startLat = latitude.value || 9.3068
  const startLng = longitude.value || 123.3054

  mapInstance = L.map(mapContainer.value).setView([startLat, startLng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  // Draw initial marker if they have coordinates
  if (latitude.value && longitude.value) {
    markerInstance = L.marker([latitude.value, longitude.value]).addTo(mapInstance)
  }

  // Move marker on click
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

  // Force resize calculation
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 250)
}

// Modal visibility helpers
function closeModal() {
  emit('update:modelValue', false)
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeModal()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) closeModal()
}

// Photo Upload Handlers
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  avatarFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      avatarPreview.value = e.target.result as string
    }
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  avatarPreview.value = ''
  avatarFile.value = null
}

// Form Submission
function handleSubmit() {
  if (!fullName.value.trim()) return

  emit('save', {
    fullName: fullName.value,
    about: about.value,
    location: location.value,
    contact: contact.value,
    avatarPreview: avatarPreview.value,
    avatarFile: avatarFile.value,
    latitude: latitude.value,     // Include new map data
    longitude: longitude.value    // Include new map data
  })

  closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div class="edit-profile-modal" role="dialog" aria-modal="true">

          <!-- Header -->
          <div class="modal-header">
            <div class="title-group">
              <div class="icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2>Edit Profile</h2>
            </div>

            <button type="button" class="close-btn" @click="closeModal" aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Form Body -->
          <form @submit.prevent="handleSubmit" class="modal-form">

            <!-- FIXED: Centered Avatar with un-clipped badge -->
            <div class="form-group avatar-group">
              <label class="center-label">Profile Picture</label>
              <div class="avatar-upload-container">
                <div v-if="avatarPreview" class="avatar-preview-wrapper">
                  <div class="avatar-preview-box">
                    <img :src="avatarPreview" alt="Avatar preview" />
                  </div>
                  <button type="button" class="delete-photo-btn" @click="removeImage">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <button v-else type="button" class="upload-box avatar-upload" @click="triggerFileInput">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Upload</span>
                </button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file-input"
                  @change="handleFileUpload"
                />
              </div>
            </div>

            <!-- Full Name -->
            <div class="form-group">
              <label for="full-name">Display Name</label>
              <input
                id="full-name"
                v-model="fullName"
                type="text"
                class="form-input"
                placeholder="Your display name"
                required
              />
            </div>

            <!-- Bio -->
            <div class="form-group">
              <label for="about">About Me</label>
              <textarea
                id="about"
                v-model="about"
                class="form-textarea"
                placeholder="Tell the community a bit about your sustainability journey..."
              ></textarea>
            </div>

            <!-- Location & Contact -->
            <div class="form-row">
              <div class="form-group half-width">
                <label for="location">Location</label>
                <input
                  id="location"
                  v-model="location"
                  type="text"
                  class="form-input"
                  placeholder="e.g. Daro, Dumaguete"
                />
              </div>
              <div class="form-group half-width">
                <label for="contact">Contact Number</label>
                <input
                  id="contact"
                  v-model="contact"
                  type="text"
                  class="form-input"
                  placeholder="912 345 6789"
                />
              </div>
            </div>

            <!-- Interactive Map -->
            <div class="form-group map-group">
              <div class="section-label-row">
                <label class="form-label">Drop a Pin</label>
                <span v-if="latitude" class="text-hint success-hint">Pin dropped!</span>
                <span v-else class="text-hint neutral-hint">Click map to set location</span>
              </div>
              <div class="map-wrapper">
                <div ref="mapContainer" class="static-map"></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-group">
              <button type="submit" class="submit-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Save Changes</span>
              </button>
              <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
            </div>

          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(26, 29, 26, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 16px; }
.edit-profile-modal { width: 100%; max-width: 550px; background: #ffffff; border-radius: 16px; box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15); padding: 28px; display: flex; flex-direction: column; gap: 20px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.title-group { display: flex; align-items: center; gap: 10px; }
.icon-wrap { width: 36px; height: 36px; background: rgba(119, 135, 50, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.title-group h2 { margin: 0; font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: #1a1d1a; }
.close-btn { width: 36px; height: 32px; background: #f7f8f6; border: none; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease; }
.close-btn:hover { background: #e4e7e3; }
.divider { width: 100%; height: 1px; background-color: #e4e7e3; }
.modal-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 16px; width: 100%; }
.half-width { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label, .form-label { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #1a1d1a; }
.form-input { width: 100%; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; color: #1a1d1a; outline: none; transition: border-color 0.15s ease; box-sizing: border-box;}
.form-input:focus, .form-textarea:focus { border-color: #778732; }
.form-textarea { width: 100%; height: 100px; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; line-height: 1.5; color: #1a1d1a; outline: none; resize: vertical; box-sizing: border-box;}

/* FIXED: Avatar Classes */
.avatar-group { display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; }
.center-label { text-align: center; margin-bottom: 4px; }
.avatar-upload-container { display: flex; justify-content: center; }
.upload-box { height: 88px; width: 88px; background: #f7f8f6; border: 2px dashed #e4e7e3; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; }
.upload-box:hover { background: #edf0ec; border-color: #778732; }
.upload-box span { font-size: 11px; font-weight: 500; color: #8f9a8f; }
.hidden-file-input { display: none; }
.avatar-preview-wrapper { position: relative; width: 88px; height: 88px; }
.avatar-preview-box { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 2px solid #e4e7e3; box-sizing: border-box; }
.avatar-preview-box img { width: 100%; height: 100%; object-fit: cover; }
.delete-photo-btn { position: absolute; top: 0px; right: 0px; width: 26px; height: 26px; background: #ef4444; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 10; transition: transform 0.1s; }
.delete-photo-btn:hover { transform: scale(1.1); }

/* Map specific */
.section-label-row { display: flex; justify-content: space-between; align-items: center; }
.text-hint { font-size: 12px; font-weight: 500; }
.neutral-hint { color: #8F9A8F; }
.success-hint { color: #778732; }
.map-wrapper { width: 100%; height: 200px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7e3; }
.static-map { width: 100%; height: 100%; min-height: 200px; z-index: 1;}

.action-group { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 8px; }
.submit-btn { padding: 12px 24px; background: #778732; border: none; border-radius: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
.submit-btn:hover { background: #65732a; }
.cancel-btn { background: transparent; border: none; color: #8f9a8f; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; }
.cancel-btn:hover { color: #1a1d1a; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
