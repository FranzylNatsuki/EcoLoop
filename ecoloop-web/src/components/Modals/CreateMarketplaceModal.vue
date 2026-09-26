<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ImagePlus, ShoppingBag, X } from 'lucide-vue-next'
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

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  initialListing?: any
  hasPurchaseRequests?: boolean
}>()

const emit = defineEmits<{
  (e: 'publish', payload: any): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Marketplace Form States
const title = ref('')
const description = ref('')
const category = ref('Plastics')
const pricingType = ref<'For Sale' | 'Free/Donation'>('For Sale')
const pricingStructure = ref<'Per Unit / kg' | 'Bulk Bundle (e.g., per 20 pcs)' | 'Total Lot Price (Price for All)'>('Per Unit / kg')
const price = ref<number | null>(null)
const quantity = ref<number | null>(null)
const quantityUnit = ref('pcs')
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const existingImages = ref<any[]>([])

// Map & Location States
const locationAddress = ref('')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null

const categories = ['Plastics', 'Glass', 'Paper/Cardboard', 'Metal', 'Electronics']
const pricingStructures = [
  'Per Unit / kg',
  'Bulk Bundle (e.g., per 20 pcs)',
  'Total Lot Price (Price for All)',
]

watch(isOpen, async (open) => {
  if (open) {
    if (props.initialListing) {
      title.value = props.initialListing.title || ''
      description.value = props.initialListing.description || ''
      category.value = props.initialListing.category || 'Plastics'
      pricingType.value = props.initialListing.pricing_type || 'For Sale'
      pricingStructure.value = props.initialListing.pricing_structure || 'Per Unit / kg'
      price.value = props.initialListing.price ?? null
      quantity.value = props.initialListing.quantity ?? null
      quantityUnit.value = props.initialListing.quantity_unit || 'pcs'
      locationAddress.value = props.initialListing.location_address || ''
      latitude.value = props.initialListing.latitude || null
      longitude.value = props.initialListing.longitude || null
      
      if (props.initialListing.images) {
        existingImages.value = [...props.initialListing.images]
      } else {
        existingImages.value = []
      }
      imageFiles.value = []
      imagePreviews.value = []
    } else {
      resetForm()
    }
    
    dialogRef.value?.showModal()
    await nextTick()
    setTimeout(() => initMap(), 150)
  } else if (dialogRef.value?.open) {
    dialogRef.value.close()
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      markerInstance = null
    }
  }
}, { immediate: true })

function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) closeModal()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) closeModal()
}

function closeModal() {
  isOpen.value = false
}

function initMap() {
  if (!mapContainer.value) return
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    markerInstance = null
  }

  // Default to Dumaguete, or use existing coords
  const defaultLat = 9.3068
  const defaultLng = 123.3054
  
  const startLat = latitude.value ?? defaultLat
  const startLng = longitude.value ?? defaultLng

  mapInstance = L.map(mapContainer.value).setView([startLat, startLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  // Place initial marker if we have coords
  if (latitude.value && longitude.value) {
    markerInstance = L.marker([latitude.value, longitude.value]).addTo(mapInstance)
  }

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

function triggerFileInput() {
  fileInputRef.value?.click()
}

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

function removeExistingImage(idx: number) {
  existingImages.value.splice(idx, 1)
}

function removeNewImage(idx: number) {
  imagePreviews.value.splice(idx, 1)
  imageFiles.value.splice(idx, 1)
}

function resetForm() {
  title.value = ''
  description.value = ''
  category.value = 'Plastics'
  pricingType.value = 'For Sale'
  pricingStructure.value = 'Per Unit / kg'
  price.value = null
  quantity.value = null
  quantityUnit.value = 'pcs'
  imageFiles.value = []
  imagePreviews.value = []
  existingImages.value = []
  locationAddress.value = ''
  latitude.value = null
  longitude.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleSubmit() {
  if (!title.value.trim() || !description.value.trim()) return

  emit('publish', {
    title: title.value.trim(),
    description: description.value.trim(),
    category: category.value,
    type: 'marketplace',
    postType: 'marketplace',
    pricingType: pricingType.value,
    pricingStructure: pricingStructure.value,
    price: price.value,
    quantity: quantity.value,
    quantityUnit: quantityUnit.value,
    images: imageFiles.value,
    retained_images: existingImages.value,
    location_address: locationAddress.value,
    latitude: latitude.value,
    longitude: longitude.value,
    timestamp: new Date().toISOString(),
  })

  resetForm()
  closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="modal-backdrop"
      @cancel="closeModal"
      @click="handleBackdropClick"
    >
      <form class="marketplace-card" @submit.prevent="handleSubmit">
        <div class="header-row">
          <div class="title-group">
            <div class="icon-container header-icon">
              <ShoppingBag :size="20" color="#778732" />
            </div>
            <h2 class="header-title">{{ props.initialListing ? 'Edit Marketplace Listing' : 'Create Marketplace Listing' }}</h2>
          </div>
          <button type="button" class="btn-close" aria-label="Close modal" @click="closeModal">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <div class="form-columns">

          <!-- LEFT COLUMN: Listing Details -->
          <div class="form-left">
            <div class="form-group">
              <label for="listing-title">Listing Title</label>
              <input
                id="listing-title"
                v-model="title"
                class="form-control"
                type="text"
                placeholder="e.g., Clean plastic bottles"
                required
                :disabled="props.hasPurchaseRequests"
              />
            </div>

            <div class="form-group">
              <label for="listing-description">Description</label>
              <textarea
                id="listing-description"
                v-model="description"
                class="form-control textarea-control"
                rows="4"
                placeholder="Add details about the materials, condition, and pickup or delivery options"
                required
              ></textarea>
            </div>

            <div class="split-row">
              <div class="form-group flex-1">
                <label for="material-category">Material Category</label>
                <select id="material-category" v-model="category" class="form-control" :disabled="props.hasPurchaseRequests">
                  <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>

              <fieldset class="form-group option-group flex-1">
                <legend>Price Type</legend>
                <div class="radio-options">
                  <label class="radio-card" :class="{ active: pricingType === 'For Sale' }">
                    <input v-model="pricingType" type="radio" value="For Sale" />
                    <span>For Sale</span>
                  </label>
                  <label class="radio-card" :class="{ active: pricingType === 'Free/Donation' }">
                    <input v-model="pricingType" type="radio" value="Free/Donation" />
                    <span>Free</span>
                  </label>
                </div>
              </fieldset>
            </div>

            <div class="pricing-grid">
              <div class="form-group full-width" v-if="pricingType === 'For Sale'">
                <label for="pricing-structure">Pricing Structure</label>
                <select id="pricing-structure" v-model="pricingStructure" class="form-control">
                  <option v-for="item in pricingStructures" :key="item" :value="item">{{ item }}</option>
                </select>
              </div>

              <div class="form-group" v-if="pricingType === 'For Sale'">
                <label for="listing-price">Price</label>
                <input
                  id="listing-price"
                  v-model.number="price"
                  class="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="₱15"
                />
              </div>

              <div class="form-group">
                <label for="listing-quantity">Quantity</label>
                <div class="quantity-input">
                  <input id="listing-quantity" v-model.number="quantity" class="form-control" type="number" min="0" placeholder="50" />
                  <select v-model="quantityUnit" class="unit-select" aria-label="Quantity unit">
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="items">items</option>
                    <option value="lots">lots</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Photos</label>
              <div class="photo-grid">
                <button type="button" class="upload-box" @click="triggerFileInput">
                  <ImagePlus :size="24" color="#8F9A8F" />
                  <span>Upload</span>
                  <input ref="fileInputRef" class="hidden-input" type="file" accept="image/png,image/jpeg" multiple @change="handleFileUpload" />
                </button>

                <!-- Existing Images -->
                <div v-for="(img, idx) in existingImages" :key="img.id" class="thumbnail-box">
                  <img :src="img.image_url" alt="preview" />
                  <button type="button" class="delete-photo-btn" @click="removeExistingImage(idx)">
                    <X :size="10" color="white" stroke-width="3" />
                  </button>
                </div>

                <!-- New Upload Previews -->
                <div v-for="(imgUrl, idx) in imagePreviews" :key="'new-'+idx" class="thumbnail-box">
                  <img :src="imgUrl" alt="preview" />
                  <button type="button" class="delete-photo-btn" @click="removeNewImage(idx)">
                    <X :size="10" color="white" stroke-width="3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Map Location -->
          <div class="form-right">
            <div class="form-group map-group">
              <div class="section-label-row">
                <label class="form-label">Item Location</label>
                <span v-if="latitude" class="text-hint success-hint">Pin dropped!</span>
                <span v-else class="text-hint neutral-hint">Click map to drop a pin</span>
              </div>

              <div class="map-wrapper">
                <div ref="mapContainer" class="map-preview"></div>
              </div>

              <div class="location-address">
                <svg class="loc-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <input v-model="locationAddress" type="text" class="form-control location-input" placeholder="Type specific address details..." />
              </div>
            </div>
          </div>

        </div>

        <div class="header-divider"></div>

        <div class="footer-actions">
          <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
          <button type="submit" class="btn-submit">Publish Listing</button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  border: none;
  padding: 0;
  background: transparent;
  max-width: 100vw;
  max-height: 100vh;
}

.modal-backdrop::backdrop {
  background: rgba(26, 29, 26, 0.45);
  backdrop-filter: blur(4px);
}

.marketplace-card {
  /* Expanded to accommodate 2-column layout */
  width: min(900px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 28px;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(26, 29, 26, 0.15);
  box-sizing: border-box;
  color: #1a1d1a;
  font-family: 'Outfit', 'Geist', sans-serif;
}

/* Form Layout */
.form-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.form-left, .form-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .form-columns {
    grid-template-columns: 1fr;
  }
}

.header-row,
.title-group,
.radio-options,
.footer-actions,
.quantity-input {
  display: flex;
  align-items: center;
}

.header-row,
.footer-actions { justify-content: space-between; }
.title-group { gap: 10px; }
.icon-container { display: flex; align-items: center; justify-content: center; background: rgba(119, 135, 50, 0.1); flex-shrink: 0; }
.header-icon { width: 40px; height: 40px; border-radius: 8px; }
.header-title { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; }
.btn-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: #f7f8f6; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.header-divider { width: 100%; height: 1px; margin: 20px 0; background: #e4e7e3; }

.form-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 0; }
.form-group label,
.option-group legend { font-size: 13px; font-weight: 700; }
.form-control,
.unit-select { width: 100%; padding: 11px 12px; border: 1px solid #d9ded7; border-radius: 8px; background: #fff; color: #1a1d1a; font: inherit; box-sizing: border-box; }
.form-control:focus,
.unit-select:focus { outline: 2px solid rgba(119, 135, 50, .3); border-color: #778732; }
.textarea-control { resize: vertical; min-height: 100px; }
.split-row { display: flex; gap: 12px; width: 100%; align-items: flex-start; }
.flex-1 { flex: 1; }
.option-group { padding: 0; border: 0; }
.option-group legend { padding: 0; margin-bottom: 8px; }
.radio-options { gap: 10px; height: 42px; }
.radio-card { flex: 1; height: 100%; display: flex; align-items: center; padding: 0 12px; border: 1px solid #d9ded7; border-radius: 8px; color: #697067; cursor: pointer; box-sizing: border-box; }
.radio-card.active { border-color: #778732; background: rgba(119, 135, 50, .08); color: #1a1d1a; }
.radio-card input { accent-color: #778732; margin-right: 7px; margin-top: 0; }
.pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; }
.full-width { grid-column: 1 / -1; }
.quantity-input { gap: 8px; }
.quantity-input .form-control { flex: 1; }
.unit-select { width: 90px; }
.upload-placeholder { width: 100%; min-height: 76px; padding: 14px; border: 1px dashed #aeb9a2; border-radius: 10px; background: #f7f8f6; color: #697067; display: flex; align-items: center; justify-content: center; gap: 9px; font: inherit; cursor: pointer; }
.upload-placeholder small { color: #8a9388; }
.hidden-input { display: none; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.upload-box { height: 96px; background: #f7f8f6; border: 1px dashed #e4e7e3; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: background 0.15s ease; }
.upload-box:hover { background: #edf0ec; }
.upload-box span { font-size: 11px; font-weight: 500; color: #8f9a8f; }
.thumbnail-box { position: relative; height: 96px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7e3; }
.thumbnail-box img { width: 100%; height: 100%; object-fit: cover; }
.delete-photo-btn { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; background: rgba(26, 29, 26, 0.8); border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.footer-actions { gap: 12px; margin-top: 8px; justify-content: flex-end; }
.btn-cancel,
.btn-submit { padding: 12px 24px; border-radius: 24px; font: inherit; font-weight: 700; cursor: pointer; text-align: center; }
.btn-cancel { border: none; background: transparent; color: #8F9A8F; text-decoration: underline; }
.btn-cancel:hover { color: #1a1d1a; }
.btn-submit { border: 1px solid #778732; background: #778732; color: #fff; }
.btn-submit:hover { background: #657329; }

/* Map Styles */
.section-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.form-label { font-size: 13px; font-weight: 700; color: #1a1d1a; }
.text-hint { font-size: 12px; font-weight: 500; }
.neutral-hint { color: #8F9A8F; }
.success-hint { color: #778732; }
.map-wrapper { width: 100%; height: 350px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7e3; margin-bottom: 8px; }
.map-preview { width: 100%; height: 100%; }
.location-address { position: relative; display: flex; align-items: center; }
.loc-icon { position: absolute; left: 14px; }
.location-input { padding-left: 40px; }

@media (max-width: 560px) {
  .marketplace-card { padding: 20px; }
  .pricing-grid { grid-template-columns: 1fr; }
  .full-width { grid-column: auto; }
  .radio-options { flex-direction: column; align-items: stretch; height: auto; }
  .radio-card { height: 42px; }
  .map-wrapper { height: 250px; }
}
</style>
