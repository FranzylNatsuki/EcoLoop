<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
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
// -----------------------------

interface PledgeItemDraft {
  material_name: string
  quantity: number
  unit: string
}

const props = defineProps<{
  postId: string | number
}>()

const isOpen = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  (e: 'submitted', payload: { pledgeId: string; quantity: number; materialName: string }): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// --- Map & Location State ---
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
// let markerInstance: L.Marker | null = null
const isMapExpanded = ref(false)

// Active Location State from Event
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const locationAddress = ref('')

// --- Image Upload State ---
const imagePreviews = ref<string[]>([])
const imageFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// Synchronize state with native HTML dialog methods
watch(isOpen, async (open) => {
  if (open) {
    dialogRef.value?.showModal()

    // Reset images on open
    imagePreviews.value = []
    imageFiles.value = []

    await fetchEventLocation()

    await nextTick()
    setTimeout(() => initMap(), 100)
  } else {
    dialogRef.value?.close()
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
      // markerInstance = null
    }
    // Cleanup images on close
    imagePreviews.value = []
    imageFiles.value = []
  }
})

// Fetch the event location directly from the events table
async function fetchEventLocation() {
  if (!props.postId) return

  try {
    const { data, error } = await supabase
      .from('events')
      .select('latitude, longitude, location, location_address')
      .eq('id', props.postId)
      .single()

    if (error) throw error

    if (data) {
      latitude.value = data.latitude
      longitude.value = data.longitude
      locationAddress.value = data.location_address || data.location || ''
    }
  } catch (err) {
    console.error("Failed to fetch event location:", err)
  }
}

function toggleMapExpand() {
  isMapExpanded.value = !isMapExpanded.value
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize()
  }, 100)
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) isOpen.value = false
}

function initMap() {
  if (!mapContainer.value || mapInstance) return

  const defaultLat = 9.3068
  const defaultLng = 123.3054

  const startLat = latitude.value || defaultLat
  const startLng = longitude.value || defaultLng

  mapInstance = L.map(mapContainer.value).setView([startLat, startLng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance)

  if (latitude.value && longitude.value) {
    L.marker([latitude.value, longitude.value]).addTo(mapInstance)
  }
}

// --- Image Handlers ---
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

function removeImage(index: number) {
  imagePreviews.value.splice(index, 1)
  imageFiles.value.splice(index, 1)
}

// Form State
const title = ref('')
const description = ref('')
const items = ref<PledgeItemDraft[]>([{ material_name: '', quantity: 1, unit: 'units' }])

function addItem() { items.value.push({ material_name: '', quantity: 1, unit: 'units' }) }
function removeItem(index: number) { if (items.value.length > 1) items.value.splice(index, 1) }
function incrementItemQty(index: number) { items.value[index].quantity++ }
function decrementItemQty(index: number) { if (items.value[index].quantity > 1) items.value[index].quantity-- }

async function handleSubmit() {
  errorMessage.value = null

  if (!props.postId || props.postId === 'undefined') {
    errorMessage.value = 'Error: Invalid Event ID.'
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

    // 1. Auth check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      errorMessage.value = 'You must be logged in to submit a donation.'
      return
    }

    // 2. Target event-specific tables
    const parentTable = 'event_pledges'
    const parentIdField = 'event_id'
    const itemsTable = 'event_pledge_items'
    const itemsFkField = 'event_pledge_id'

    // Insert Event Pledge Payload
    const { data: pledge, error: pledgeError } = await supabase
      .from(parentTable)
      .insert({
        [parentIdField]: String(props.postId),
        donor_id: session.user.id,
        title: title.value.trim(),
        description: description.value.trim(),
        location_address: locationAddress.value.trim() || null,
        latitude: latitude.value,
        longitude: longitude.value,
        status: 'pending'
      })
      .select('id')
      .single()

    if (pledgeError || !pledge) {
      throw new Error(pledgeError?.message || 'Failed to initialize event pledge.')
    }

    // 3. Insert Line Items
    const payloadItems = validItems.map((item) => ({
      [itemsFkField]: pledge.id,
      material_name: item.material_name.trim(),
      quantity: item.quantity,
      unit: item.unit.trim() || 'units'
    }))

    const { error: itemsError } = await supabase
      .from(itemsTable)
      .insert(payloadItems)

    if (itemsError) throw new Error(itemsError.message)

    // 4. Update current_quantity in event_materials table
    for (const item of validItems) {
          const matName = item.material_name.trim()
          const qtyToAdd = Number(item.quantity) || 0

          console.log(`🔍 Searching event_materials for "${matName}" under event ${props.postId}...`)

          const { data: matData, error: selectErr } = await supabase
            .from('event_materials')
            .select('id, current_quantity')
            .eq('event_id', props.postId)
            .ilike('material_name', matName)
            .maybeSingle()

          if (selectErr) {
            console.error(`❌ Error finding material "${matName}":`, selectErr.message)
            continue
          }

          if (matData) {
            const currentQty = Number(matData.current_quantity) || 0
            const updatedQty = currentQty + qtyToAdd

            const { error: updateErr } = await supabase
              .from('event_materials')
              .update({ current_quantity: updatedQty })
              .eq('id', matData.id)

            if (updateErr) {
              console.error(`❌ DB Update failed for "${matName}":`, updateErr.message)
            } else {
              console.log(`✅ Updated "${matName}"! Old Qty: ${currentQty} -> New Qty: ${updatedQty}`)
            }
          } else {
            console.warn(`⚠️ No row matching material_name "${matName}" found in event_materials table.`)
          }
        }

    // 5. Upload & Insert Images
    for (const file of imageFiles.value) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `pledge-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file)

      if (!uploadError) {
        const { data } = supabase.storage.from('images').getPublicUrl(filePath)

        await supabase.from('pledge_images').insert({
          pledge_id: pledge.id,
          image_url: data.publicUrl,
          display_order: 99
        })
      }
    }

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
    imagePreviews.value = []
    imageFiles.value = []

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
            <h2>Donate Event Materials</h2>
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
          <!-- Left Column: Material Line Items & Details -->
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
                    placeholder="Material name (e.g., Water Bottles)"
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
                <button v-if="items.length > 1" type="button" class="delete-item-btn" @click="removeItem(idx)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Donation Title</label>
              <input v-model="title" type="text" class="form-input" placeholder="e.g., Extra cleanup supplies" />
            </div>

            <div class="form-group">
              <label class="form-label">Description of Materials</label>
              <textarea v-model="description" class="form-textarea" placeholder="Describe the condition, cleanliness, or batch details..."></textarea>
            </div>

            <!-- Image Uploader -->
            <div class="form-group">
              <label class="form-label">Photos (Optional)</label>
              <div class="photo-grid">
                <button type="button" class="upload-box" @click="triggerFileInput">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Upload</span>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden-file-input"
                    @change="handleFileUpload"
                  />
                </button>

                <div v-for="(img, idx) in imagePreviews" :key="idx" class="thumbnail-box">
                  <img :src="img" alt="Uploaded preview" />
                  <button type="button" class="delete-photo-btn" @click="removeImage(idx)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Location -->
          <div class="form-column">
            <div class="form-group map-group">
              <div class="section-label-row">
                <label class="form-label">Event Location</label>
                <span v-if="latitude" class="text-hint neutral-hint">Map location retrieved</span>
                <span v-else class="text-hint" style="color: #b91c1c;">No event location set</span>
              </div>

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

              <div class="location-address">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <input
                  v-model="locationAddress"
                  type="text"
                  class="form-input location-input read-only-input"
                  readonly
                  placeholder="No address provided by event host"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button type="button" class="submit-btn" :disabled="isSubmitting" @click="handleSubmit">
            <svg v-if="isSubmitting" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <span v-if="isSubmitting" style="margin-left: 8px;">Submitting...</span>
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
  height: 250px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.location-address {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.location-address svg {
  position: absolute;
  left: 14px;
}

.location-input {
  flex: 1;
  padding-left: 40px !important;
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
  display: flex;
  align-items: center;
  justify-content: center;
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

.map-wrapper {
  position: relative;
  width: 100%;
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

.map-wrapper.is-expanded {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  background: white;
}

.map-wrapper.is-expanded .map-preview {
  height: 100vh;
  border-radius: 0;
  border: none;
}

.read-only-input {
  background-color: #f9fafb !important;
  color: #6b7280;
  cursor: not-allowed;
  border-color: #e5e7eb !important;
  box-shadow: none !important;
}

.neutral-hint { color: #6b7280; }

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 4px;
}

.upload-box {
  height: 96px;
  background: #f7f8f6;
  border: 1px dashed #e4e7e3;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.upload-box:hover {
  background: #edf0ec;
}

.upload-box span {
  font-size: 11px;
  font-weight: 500;
  color: #8f9a8f;
}

.hidden-file-input {
  display: none;
}

.thumbnail-box {
  position: relative;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7e3;
}

.thumbnail-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-photo-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(26, 29, 26, 0.8);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
