<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '../../composables/useAuth'
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'publish', newPost: {
    category: string;
    title: string;
    description: string;
    images: string[];
    latitude: number | null;
    longitude: number | null;
    location_address: string;
  }): void
}>()

// Form States
const selectedCategory = ref('Gardening')
const title = ref('')
const description = ref('')
const imagePreviews = ref<string[]>([])
const imageFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isSubmitting = ref(false)

// Map & Location States
const locationAddress = ref('')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null

const categories = [
  'Gardening',
  'Composting',
  'Upcycling',
  'Crafts & DIY',
  'Zero Waste',
  'E-Waste',
  'Clean-Up Drive',
  'Recycling Workshop',
  'Upcycling Event',
  'Tree Planting'
]

function closeModal() {
  if (isSubmitting.value) return
  emit('update:modelValue', false)
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeModal()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) closeModal()
}

function initMap() {
  if (!mapContainer.value) return
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    markerInstance = null
  }

  const defaultLat = 9.3068
  const defaultLng = 123.3054

  mapInstance = L.map(mapContainer.value).setView([defaultLat, defaultLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

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

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 100)
}

function triggerFileInput() { fileInputRef.value?.click() }

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  files.forEach((file) => {
    imageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        imagePreviews.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
}

function removeImage(index: number) {
  imagePreviews.value.splice(index, 1)
  imageFiles.value.splice(index, 1)
}

async function handleSubmit() {
  if (!title.value.trim() || !description.value.trim()) return

  isSubmitting.value = true
  const uploadedUrls: string[] = []

  try {
    for (const file of imageFiles.value) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `post-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file)
      if (uploadError) continue

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      uploadedUrls.push(data.publicUrl)
    }

    emit('publish', {
      category: selectedCategory.value,
      title: title.value,
      description: description.value,
      images: uploadedUrls,
      latitude: latitude.value,
      longitude: longitude.value,
      location_address: locationAddress.value
    })

    title.value = ''
    description.value = ''
    locationAddress.value = ''
    latitude.value = null
    longitude.value = null
    imagePreviews.value = []
    imageFiles.value = []
    emit('update:modelValue', false)

  } catch (error) {
    console.error('Submission failed:', error)
  } finally {
    isSubmitting.value = false
  }
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
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
        <div class="create-post-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="title-group">
              <div class="icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h2>Create New Post</h2>
            </div>
            <button type="button" class="close-btn" @click="closeModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="divider"></div>

          <form @submit.prevent="handleSubmit" class="modal-form">
            <div class="form-columns">
              <div class="form-left">
                <div class="form-group">
                  <label for="post-category">Category</label>
                  <div class="select-wrapper">
                    <select id="post-category" v-model="selectedCategory" class="custom-select">
                      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>

                <div class="form-group">
                  <label for="post-title">Post Title</label>
                  <input id="post-title" v-model="title" type="text" class="form-input" placeholder="e.g. Need cardboard..." required />
                </div>

                <div class="form-group">
                  <label for="post-desc">Description</label>
                  <textarea id="post-desc" v-model="description" class="form-textarea" placeholder="We are setting up sheet mulch beds..." required></textarea>
                </div>

                <div class="form-group">
                  <label>Photos (Optional)</label>
                  <div class="photo-grid">
                    <button type="button" class="upload-box" @click="triggerFileInput">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>Upload</span>
                      <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden-file-input" @change="handleFileUpload" />
                    </button>

                    <div v-for="(img, idx) in imagePreviews" :key="idx" class="thumbnail-box">
                      <img :src="img" alt="preview" />
                      <button type="button" class="delete-photo-btn" @click="removeImage(idx)">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-right">
                <div class="form-group map-group">
                  <div class="section-label-row">
                    <label class="form-label">Project Location</label>
                    <span v-if="latitude" class="text-hint success-hint">Pin dropped!</span>
                    <span v-else class="text-hint neutral-hint">Click map to drop a pin</span>
                  </div>

                  <div class="map-wrapper">
                    <div ref="mapContainer" class="map-preview"></div>
                  </div>

                  <div class="location-address">
                    <svg class="loc-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input v-model="locationAddress" type="text" class="form-input location-input" placeholder="Type specific address details..." />
                  </div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="action-group">
              <button type="button" class="cancel-btn" @click="closeModal" :disabled="isSubmitting">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="isSubmitting" :class="{ 'is-loading': isSubmitting }">
                <svg v-if="isSubmitting" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span>{{ isSubmitting ? 'Publishing...' : 'Publish Post' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(26, 29, 26, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 16px; }
.create-post-modal { width: 100%; max-width: 900px; background: #ffffff; border-radius: 16px; box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15); padding: 28px; display: flex; flex-direction: column; gap: 20px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.title-group { display: flex; align-items: center; gap: 10px; }
.icon-wrap { width: 36px; height: 36px; background: rgba(119, 135, 50, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.title-group h2 { margin: 0; font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: #1a1d1a; }
.close-btn { width: 36px; height: 32px; background: #f7f8f6; border: none; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease; }
.close-btn:hover { background: #e4e7e3; }
.divider { width: 100%; height: 1px; background-color: #e4e7e3; }
.modal-form { display: flex; flex-direction: column; gap: 20px; }
.form-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 768px) { .form-columns { grid-template-columns: 1fr; } }
.form-left, .form-right { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label, .form-label { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #1a1d1a; }
.select-wrapper { position: relative; display: flex; align-items: center; }
.custom-select { width: 100%; padding: 12px 16px; background: #f7f8f6; border: 1.5px solid #778732; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; color: #1a1d1a; appearance: none; outline: none; cursor: pointer; }
.chevron-icon { position: absolute; right: 16px; pointer-events: none; }
.form-input { width: 100%; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; color: #1a1d1a; outline: none; transition: border-color 0.15s ease; }
.form-input:focus, .form-textarea:focus { border-color: #778732; }
.form-textarea { width: 100%; height: 120px; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; line-height: 1.5; color: #1a1d1a; outline: none; resize: vertical; }
.section-label-row { display: flex; justify-content: space-between; align-items: center; }
.text-hint { font-size: 12px; font-weight: 500; }
.neutral-hint { color: #8F9A8F; }
.success-hint { color: #778732; }
.map-wrapper { width: 100%; height: 250px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7e3; }
.map-preview { width: 100%; height: 100%; }
.location-address { position: relative; display: flex; align-items: center; }
.loc-icon { position: absolute; left: 14px; }
.location-input { padding-left: 40px; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.upload-box { height: 96px; background: #f7f8f6; border: 1px dashed #e4e7e3; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: background 0.15s ease; }
.upload-box:hover { background: #edf0ec; }
.upload-box span { font-size: 11px; font-weight: 500; color: #8f9a8f; }
.hidden-file-input { display: none; }
.thumbnail-box { position: relative; height: 96px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7e3; }
.thumbnail-box img { width: 100%; height: 100%; object-fit: cover; }
.delete-photo-btn { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; background: rgba(26, 29, 26, 0.8); border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.action-group { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
.submit-btn { padding: 12px 24px; background: #778732; border: none; border-radius: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s ease, opacity 0.15s; }
.submit-btn:hover:not(.is-loading) { background: #65732a; }
.submit-btn.is-loading { opacity: 0.7; cursor: not-allowed; }
.cancel-btn { background: transparent; border: none; color: #8f9a8f; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; }
.cancel-btn:hover { color: #1a1d1a; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
