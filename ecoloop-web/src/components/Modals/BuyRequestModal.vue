<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Check, Package, X } from 'lucide-vue-next'
import { supabase } from '../../composables/useAuth'

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
const pickupPreference = ref('pickup')
const isSubmitting = ref(false)

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
  return material.quantity ?? material.target
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    selectedMaterial.value = materialName(availableMaterials.value[0])
    requestedQuantity.value = 1
    await nextTick()
    if (dialogRef.value && !dialogRef.value.open) dialogRef.value.showModal()
  } else if (dialogRef.value?.open) {
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
    let finalNotes = `Preference: ${pickupPreference.value}`;
    if (messageText.value) {
      finalNotes += `

Buyer Notes:
${messageText.value}`;
    }

    const payload = {
      post_id: props.post.id,
      seller_id: sellerId,
      buyer_id: currentUserId,
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
    emit('submit', data)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Failed to create purchase request:', error)
  } finally {
    isSubmitting.value = false
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
          <span class="field-label">Delivery Preference</span>
          <div class="radio-group">
            <label class="radio-option" :class="{ active: pickupPreference === 'pickup' }">
              <input type="radio" v-model="pickupPreference" value="pickup" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">I will pick it up</span>
            </label>
            <label class="radio-option" :class="{ active: pickupPreference === 'deliver' }">
              <input type="radio" v-model="pickupPreference" value="deliver" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">Please deliver to me</span>
            </label>
            <label class="radio-option" :class="{ active: pickupPreference === 'meetup' }">
              <input type="radio" v-model="pickupPreference" value="meetup" class="sr-only" />
              <span class="radio-dot"></span>
              <span class="option-label">Meet at public place</span>
            </label>
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
            <input v-model.number="requestedQuantity" class="input-box" type="number" min="1" required />
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
.modal-backdrop { border: none; padding: 0; background: transparent; max-width: 100vw; max-height: 100vh; }
.modal-backdrop::backdrop { background: rgba(0, 0, 0, .4); }
.materials-modal-card { width: min(680px, calc(100vw - 32px)); padding: 32px; background: #fff; border-radius: 16px; box-shadow: 0 16px 40px rgba(26, 29, 26, .15); box-sizing: border-box; }
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
.action-group { gap: 12px; margin-top: 24px; }
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
</style>

