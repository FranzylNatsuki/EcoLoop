<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Check, Package, X } from 'lucide-vue-next'
import { supabase } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Vite Leaflet Icon Fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

interface MaterialOption {
  name?: string
  material?: string
  material_name?: string
  quantity?: number | string | null
  target?: number | string | null
  unit?: string
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  post?: any
}>(), {
  post: null
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'submit', payload: any): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const selectedMaterial = ref('')
const requestedQuantity = ref(1)
const messageText = ref('')
const pickupPreference = ref<'pickup' | 'community' | 'deliver'>('pickup')
const deliveryAddress = ref('')
const comCenterLocation = ref('')
const meetupLat = ref<number | null>(null)
const meetupLng = ref<number | null>(null)
const deliveryLat = ref<number | null>(null)
const deliveryLng = ref<number | null>(null)
const handoverMapContainer = ref<HTMLElement | null>(null)
let handoverMapInstance: L.Map | null = null
let handoverMarkerInstance: L.Marker | null = null
const isSubmitting = ref(false)
const { addToast } = useToast()

const availableMaterials = computed<MaterialOption[]>(() => {
  const source = props.post?.materials || props.post?.material_type
  const rawList = Array.isArray(source) ? source : source ? [source] : []
  if (!rawList.length) return [{ name: props.post?.title || 'Material' }]
  return rawList.map(item =>
    typeof item === 'string' ? { name: item, material_name: item } : item
  )
})

function materialName(material: MaterialOption) {
  return material.name || material.material || material.material_name || props.post?.title || 'Material'
}

function materialQuantity(material: MaterialOption) {
  // If the material has a specific quantity, use it.
  if (material.quantity !== undefined && material.quantity !== null) return material.quantity;
  if (material.target !== undefined && material.target !== null) return material.target;
  // Fallback to the marketplace listing's overall quantity
  if (props.post?.quantity !== undefined && props.post?.quantity !== null) return props.post.quantity;
  return null;
}

const maxQuantity = computed(() => {
  const selected = availableMaterials.value.find(m => materialName(m) === selectedMaterial.value)
  if (!selected) return props.post?.quantity ? Number(props.post.quantity) : 1
  const qty = materialQuantity(selected)
  return qty ? Number(qty) : (props.post?.quantity ? Number(props.post.quantity) : 1)
})

function updateHandoverMap() {
  if (!handoverMapContainer.value) return

  const defaultLat = 9.3068
  const defaultLng = 123.3054

  let targetLat: number
  let targetLng: number
  let popupText = ''
  let isDraggable = false

  if (pickupPreference.value === 'pickup') {
    // Pickup: Poster's Map
    targetLat = props.post?.latitude != null ? Number(props.post.latitude) : defaultLat
    targetLng = props.post?.longitude != null ? Number(props.post.longitude) : defaultLng
    popupText = `<b>Poster's Pickup Location</b><br>${props.post?.location_address || 'Seller location'}`
    isDraggable = false
  } else if (pickupPreference.value === 'community') {
    // Meetup: Meetup Map
    targetLat = meetupLat.value ?? (props.post?.latitude != null ? Number(props.post.latitude) : defaultLat)
    targetLng = meetupLng.value ?? (props.post?.longitude != null ? Number(props.post.longitude) : defaultLng)
    popupText = `<b>Meetup Location</b><br>${comCenterLocation.value || 'Click map or drag pin to set meetup spot'}`
    isDraggable = true
    if (meetupLat.value === null) meetupLat.value = targetLat
    if (meetupLng.value === null) meetupLng.value = targetLng
  } else {
    // Deliver: Same Map Input
    targetLat = deliveryLat.value ?? defaultLat
    targetLng = deliveryLng.value ?? defaultLng
    popupText = `<b>Buyer's Delivery Location</b><br>${deliveryAddress.value || 'Click map or drag pin to set delivery spot'}`
    isDraggable = true
    if (deliveryLat.value === null) deliveryLat.value = targetLat
    if (deliveryLng.value === null) deliveryLng.value = targetLng
  }

  if (!handoverMapInstance) {
    handoverMapInstance = L.map(handoverMapContainer.value).setView([targetLat, targetLng], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(handoverMapInstance)

    handoverMarkerInstance = L.marker([targetLat, targetLng], { draggable: isDraggable })
      .addTo(handoverMapInstance)
      .bindPopup(popupText)
      .openPopup()

    const handleCoordChange = (lat: number, lng: number) => {
      if (pickupPreference.value === 'pickup') return
      if (pickupPreference.value === 'community') {
        meetupLat.value = lat
        meetupLng.value = lng
      } else if (pickupPreference.value === 'deliver') {
        deliveryLat.value = lat
        deliveryLng.value = lng
      }
      if (handoverMarkerInstance) {
        handoverMarkerInstance.setLatLng([lat, lng])
        handoverMarkerInstance.openPopup()
      }
    }

    handoverMarkerInstance.on('dragend', (e: any) => {
      const latlng = e.target.getLatLng()
      handleCoordChange(latlng.lat, latlng.lng)
    })

    handoverMapInstance.on('click', (e: L.LeafletMouseEvent) => {
      handleCoordChange(e.latlng.lat, e.latlng.lng)
    })
  } else {
    handoverMapInstance.setView([targetLat, targetLng], 14)
    if (handoverMarkerInstance) {
      handoverMarkerInstance.setLatLng([targetLat, targetLng])
      if (handoverMarkerInstance.dragging) {
        if (isDraggable) {
          handoverMarkerInstance.dragging.enable()
        } else {
          handoverMarkerInstance.dragging.disable()
        }
      }
      handoverMarkerInstance.bindPopup(popupText).openPopup()
    }
  }

  setTimeout(() => {
    if (handoverMapInstance) handoverMapInstance.invalidateSize()
  }, 150)
}

watch(pickupPreference, async () => {
  await nextTick()
  updateHandoverMap()
})

watch(() => props.modelValue, async (open) => {
  if (open) {
    selectedMaterial.value = materialName(availableMaterials.value[0])
    requestedQuantity.value = 1

    // Prefill meetup default from post coords if available
    if (props.post?.latitude && props.post?.longitude) {
      meetupLat.value = Number(props.post.latitude)
      meetupLng.value = Number(props.post.longitude)
    }

    // Prefill buyer delivery address and coordinates from profile if available
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, latitude, longitude')
          .eq('id', session.user.id)
          .maybeSingle()
        if (profile) {
          if (profile.address && !deliveryAddress.value) {
            deliveryAddress.value = profile.address
          }
          if (profile.latitude && profile.longitude) {
            deliveryLat.value = Number(profile.latitude)
            deliveryLng.value = Number(profile.longitude)
          }
        }
      }
    } catch (e) {
      console.warn('Could not prefill address:', e)
    }

    if (!comCenterLocation.value) {
      comCenterLocation.value = props.post?.location_address
        ? `${props.post.location_address} Community Center`
        : 'Barangay Community Center'
    }

    await nextTick()
    if (dialogRef.value && !dialogRef.value.open) dialogRef.value.showModal()
    setTimeout(updateHandoverMap, 150)
  } else if (dialogRef.value?.open) {
    if (handoverMapInstance) {
      handoverMapInstance.remove()
      handoverMapInstance = null
      handoverMarkerInstance = null
    }
    dialogRef.value.close()
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) close()
}

async function submit() {
  if (isSubmitting.value || !props.post?.id) return
  
  if (requestedQuantity.value <= 0) {
    addToast('Quantity must be at least 1.', 'error')
    return
  }
  
  if (requestedQuantity.value > maxQuantity.value) {
    addToast(`You cannot request more than the available inventory (${maxQuantity.value}).`, 'error')
    return
  }
  
  isSubmitting.value = true

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session) throw new Error('You must be signed in to submit a purchase request.')

    const sellerId = props.post?.user_id
      || props.post?.author_id
      || props.post?.seller_id
      || props.post?.author?.id
      || props.post?.created_by

    if (!sellerId) {
      console.log('Full post prop received by modal:', props.post)
      throw new Error('The listing creator could not be identified.')
    }

    const currentUserId = session.user.id

    let chosenLocation = ''
    let chosenLat: number | null = null
    let chosenLng: number | null = null

    if (pickupPreference.value === 'pickup') {
      chosenLocation = props.post?.location_address || 'Seller pickup location'
      chosenLat = props.post?.latitude != null ? Number(props.post.latitude) : null
      chosenLng = props.post?.longitude != null ? Number(props.post.longitude) : null
    } else if (pickupPreference.value === 'community') {
      chosenLocation = comCenterLocation.value.trim() || 'Community Center'
      chosenLat = meetupLat.value
      chosenLng = meetupLng.value
    } else {
      chosenLocation = deliveryAddress.value.trim() || 'Buyer delivery address'
      chosenLat = deliveryLat.value
      chosenLng = deliveryLng.value
    }

    let finalNotes = `Preference: ${pickupPreference.value}\nLocation: ${chosenLocation}`

    if (chosenLat != null && chosenLng != null && !isNaN(chosenLat) && !isNaN(chosenLng)) {
      finalNotes += `\nCoordinates: ${chosenLat},${chosenLng}`
    }

    if (messageText.value.trim()) {
      finalNotes += `\nBuyer Notes: ${messageText.value.trim()}`
    }

    const payload = {
      post_id: props.post.id,
      seller_id: sellerId,
      buyer_id: currentUserId,
      quantity: requestedQuantity.value,
      notes: finalNotes,
      status: 'pending'
    }

    console.log('Creating purchase request with payload:', payload)
    const { data, error } = await supabase
      .from('purchase_requests')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    console.log('Purchase request created successfully:', data)
    addToast('Purchase request sent to the seller!', 'success')
    emit('submit', data)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Failed to create purchase request:', error)
  } finally {
    isSubmitting.value = false
  }
}

function blockInvalidNumberChars(e: KeyboardEvent) {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialogRef" class="modal-backdrop" @cancel="close" @click="handleBackdropClick">
      <form class="materials-modal-card" @submit.prevent="submit">
        <div class="header-row">
          <div class="title-group">
            <div class="header-icon-wrap">
              <Package :size="20" color="#778732" />
            </div>
            <div>
              <h2 class="header-title">Request to Buy</h2>
              <p class="header-subtitle">Select an available material and quantity</p>
            </div>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="close">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <div class="listing-summary">
          <span class="summary-badge">{{ post?.category || 'Marketplace' }}</span>
          <strong>{{ post?.title || 'Marketplace listing' }}</strong>
          <p>{{ post?.description }}</p>
        </div>

        <div class="form-group radio-section">
          <span class="field-label">Delivery & Handover Preference</span>
          <div class="radio-group">
            <label class="radio-option" :class="{ active: pickupPreference === 'pickup' }">
              <input type="radio" v-model="pickupPreference" value="pickup" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">I will pick it up</span>
            </label>
            <label class="radio-option" :class="{ active: pickupPreference === 'community' }">
              <input type="radio" v-model="pickupPreference" value="community" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">Meet at com center</span>
            </label>
            <label class="radio-option" :class="{ active: pickupPreference === 'deliver' }">
              <input type="radio" v-model="pickupPreference" value="deliver" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">Please deliver to me</span>
            </label>
          </div>

          <!-- Dynamic Location Details based on Selected Preference -->
          <div class="location-preference-box">
            <!-- 1. Pickup: Poster's Map -->
            <div v-if="pickupPreference === 'pickup'" class="info-location-note">
              <span class="loc-label">Pickup Location:</span>
              <p class="loc-val">📍 {{ post?.location_address || 'Seller pickup location' }}</p>
              <div class="map-section-header">
                <span class="map-hint-text">Poster's Map (Item pickup point):</span>
                <span v-if="post?.latitude && post?.longitude" class="coords-pill">
                  📍 {{ Number(post.latitude).toFixed(4) }}, {{ Number(post.longitude).toFixed(4) }}
                </span>
              </div>
            </div>

            <!-- 2. Meetup: Meetup Map -->
            <div v-else-if="pickupPreference === 'community'" class="input-location-row">
              <label class="field-sublabel">Meetup Place / Community Center:</label>
              <input
                v-model="comCenterLocation"
                type="text"
                class="input-box"
                placeholder="e.g. Barangay Hall / Central Community Center"
                required
              />
              <div class="map-section-header">
                <span class="map-hint-text">Meetup Map (Click or drag pin to set meetup spot):</span>
                <span v-if="meetupLat && meetupLng" class="coords-pill">
                  📍 {{ meetupLat.toFixed(4) }}, {{ meetupLng.toFixed(4) }}
                </span>
              </div>
            </div>

            <!-- 3. Deliver to me: Same Map Input -->
            <div v-else-if="pickupPreference === 'deliver'" class="input-location-row">
              <label class="field-sublabel">Delivery Address:</label>
              <input
                v-model="deliveryAddress"
                type="text"
                class="input-box"
                placeholder="Enter complete delivery street address, city"
                required
              />
              <div class="map-section-header">
                <span class="map-hint-text">Delivery Map (Click or drag pin to confirm drop-off location):</span>
                <span v-if="deliveryLat && deliveryLng" class="coords-pill">
                  📍 {{ deliveryLat.toFixed(4) }}, {{ deliveryLng.toFixed(4) }}
                </span>
              </div>
            </div>

            <!-- Shared Handover Map for all 3 choices -->
            <div ref="handoverMapContainer" class="handover-map-preview"></div>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-group material-field">
            <span class="field-label">Material Type</span>
            <select v-model="selectedMaterial" class="input-box" required>
              <option
                v-for="(material, index) in availableMaterials"
                :key="`${materialName(material)}-${index}`"
                :value="materialName(material)"
              >
                {{ materialName(material) }}<template v-if="materialQuantity(material)"> ({{ materialQuantity(material) }}{{ material.unit ? ` ${material.unit}` : '' }} available)</template>
              </option>
            </select>
          </label>

          <label class="form-group">
            <span class="field-label">Qty</span>
            <input v-model.number="requestedQuantity" class="input-box" type="number" min="1" :max="maxQuantity" required @keydown="blockInvalidNumberChars" />
          </label>
        </div>

        <label class="form-group message-field">
          <span class="field-label">Message (optional)</span>
          <textarea v-model="messageText" class="input-box" rows="3" placeholder="Add a note for the seller"></textarea>
        </label>

        <div class="action-group">
          <button type="submit" class="btn-submit">
            <Check :size="18" color="#FFFFFF" />
            <span>Send Purchase Request</span>
          </button>
          <button type="button" class="btn-cancel" @click="close">Cancel</button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.modal-backdrop { border: none; padding: 24px 0; background: transparent; max-width: 100vw; max-height: 100vh; box-sizing: border-box; }
.modal-backdrop::backdrop { background: rgba(0, 0, 0, .4); }
.materials-modal-card { width: min(680px, calc(100vw - 32px)); min-height: min(85vh, 800px); max-height: calc(100vh - 48px); overflow-y: auto; padding: 32px; background: #fff; border-radius: 16px; box-shadow: 0 16px 40px rgba(26, 29, 26, .15); box-sizing: border-box; display: flex; flex-direction: column; }
.header-row, .title-group, .action-group { display: flex; align-items: center; }
.header-row { justify-content: space-between; }
.title-group { gap: 10px; }
.header-icon-wrap { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(119, 135, 50, .1); }
.header-title { margin: 0; color: #1a1d1a; font-size: 22px; }
.header-subtitle { margin: 4px 0 0; color: #8f9a8f; font-size: 13px; }
.btn-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: #f7f8f6; cursor: pointer; }
.header-divider { height: 1px; margin: 20px 0; background: #e4e7e3; }
.listing-summary { padding: 14px; border-radius: 10px; background: #f7f8f6; color: #1a1d1a; }
.listing-summary p { margin: 6px 0 0; color: #697067; font-size: 13px; }
.summary-badge { display: block; margin-bottom: 6px; color: #778732; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-top: 20px; }
.form-group { display: flex; flex-direction: column; gap: 7px; }
.message-field { margin-top: 16px; }
.field-label { color: #1a1d1a; font-size: 13px; font-weight: 700; }
.input-box { width: 100%; padding: 11px 12px; border: 1px solid #d9ded7; border-radius: 8px; background: #fff; color: #1a1d1a; font: inherit; box-sizing: border-box; }
.action-group { gap: 12px; margin-top: auto; padding-top: 24px; }
.btn-submit, .btn-cancel { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer; }
.btn-submit { border: 1px solid #778732; background: #778732; color: #fff; }
.btn-cancel { border: 1px solid #d9ded7; background: #fff; color: #1a1d1a; }
@media (max-width: 560px) { .materials-modal-card { padding: 20px; } .form-grid { grid-template-columns: 1fr; } }

.radio-section { margin-top: 16px; margin-bottom: 8px; }
.radio-group { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.radio-option { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #d9ded7; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.radio-option:hover { background: #f9fafb; }
.radio-option.active { border-color: #778732; background: #fbfdf9; }
.radio-dot { width: 18px; height: 18px; border: 2px solid #9ca3af; border-radius: 50%; position: relative; }
.radio-option.active .radio-dot { border-color: #778732; }
.radio-option.active .radio-dot::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #778732; border-radius: 50%; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
@media (min-width: 480px) { .radio-group { flex-direction: row; } .radio-option { flex: 1; justify-content: center; padding: 12px; } }

.location-preference-box {
  margin-top: 12px;
}
.info-location-note {
  padding: 12px 14px;
  background: #f7f9f5;
  border: 1px solid #e1e7dc;
  border-radius: 8px;
}
.loc-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #778732;
  letter-spacing: 0.5px;
}
.loc-val {
  margin: 4px 0 0;
  font-size: 13px;
  color: #2c332b;
}
.input-location-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-sublabel {
  font-size: 12px;
  font-weight: 600;
  color: #3f473d;
}

.map-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.map-hint-text {
  font-size: 11px;
  color: #697067;
  font-weight: 500;
}

.coords-pill {
  font-size: 11px;
  font-weight: 600;
  color: #778732;
  background: #f0f4ea;
  padding: 2px 6px;
  border-radius: 4px;
}

.handover-map-preview {
  width: 100%;
  height: 240px;
  border-radius: 8px;
  border: 1px solid #d9ded7;
  margin-top: 8px;
  overflow: hidden;
  background: #eaebec;
}
</style>

