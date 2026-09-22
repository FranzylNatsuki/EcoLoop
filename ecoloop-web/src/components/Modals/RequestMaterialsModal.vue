<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Package,
  X,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Check
} from 'lucide-vue-next'

interface EventDetails {
  title?: string
  description?: string
  category?: string
  bannerImage?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  organizer?: string
}

interface MaterialItem {
  id: string
  name: string
  quantity: number | string
  unit: string
}

const props = defineProps<{
  eventDetails?: EventDetails
}>()

// Controls visibility of THIS final modal
const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'publish', payload: { event: EventDetails; materials: MaterialItem[] }): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

// Materials list state
const materials = ref<MaterialItem[]>([])

const newItemName = ref('')
const newItemQuantity = ref<number | string>('')
const newItemUnit = ref('pcs')

// Native HTML dialog visibility sync
watch(isOpen, (open) => {
  if (open) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
}, { immediate: true })

function handleBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) {
    isOpen.value = false
  }
}

function addMaterial() {
  if (!newItemName.value.trim()) return

  materials.value.push({
    id: Date.now().toString(),
    name: newItemName.value.trim(),
    quantity: Number(newItemQuantity.value) || 1,
    unit: newItemUnit.value.trim() || 'pcs'
  })

  newItemName.value = ''
  newItemQuantity.value = ''
  newItemUnit.value = 'pcs'
}

function removeMaterial(id: string) {
  materials.value = materials.value.filter(item => item.id !== id)
}

function handlePublish() {
  emit('publish', {
    event: props.eventDetails || {},
    materials: materials.value
  })
  isOpen.value = false
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
      <div class="materials-modal-card">
        <!-- Header -->
        <div class="header-row">
          <div class="title-group">
            <div class="header-icon-wrap">
              <Package :size="20" color="#778732" />
            </div>
            <div>
              <h2 class="header-title">Request Materials</h2>
              <p class="header-subtitle">Specify materials needed for your event</p>
            </div>
          </div>
          <button type="button" class="btn-close" @click="isOpen = false">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <!-- Event Summary Preview Card -->
        <div v-if="eventDetails?.title" class="event-summary-card">
          <div class="summary-details">
            <span class="summary-badge">{{ eventDetails.category || 'Event' }}</span>
            <h4 class="summary-title">{{ eventDetails.title }}</h4>
            <div class="summary-meta">
              <span v-if="eventDetails.date" class="meta-item">
                <Calendar :size="13" /> {{ eventDetails.date }}
              </span>
              <span v-if="eventDetails.location" class="meta-item">
                <MapPin :size="13" /> {{ eventDetails.location }}
              </span>
            </div>
          </div>
        </div>

        <!-- Material Add Form -->
        <div class="add-material-form">
          <div class="input-row">
            <div class="form-group flex-2">
              <label class="field-label">Material / Resource Name</label>
              <input
                v-model="newItemName"
                type="text"
                class="input-box"
                placeholder="e.g. Cardboard Boxes, Paint"
                @keyup.enter="addMaterial"
              />
            </div>
            <div class="form-group flex-1">
              <label class="field-label">Qty</label>
              <input
                v-model="newItemQuantity"
                type="number"
                min="1"
                class="input-box"
                placeholder="10"
                @keyup.enter="addMaterial"
              />
            </div>
            <div class="form-group flex-1">
              <label class="field-label">Unit</label>
              <input
                v-model="newItemUnit"
                type="text"
                class="input-box"
                placeholder="pcs / kg"
                @keyup.enter="addMaterial"
              />
            </div>
            <button
              type="button"
              class="btn-add-item"
              @click="addMaterial"
              :disabled="!newItemName.trim()"
            >
              <Plus :size="18" />
            </button>
          </div>
        </div>

        <!-- Material Item Stack -->
        <div class="materials-list-wrapper">
          <span class="field-label">Requested Items List ({{ materials.length }})</span>

          <div v-if="materials.length === 0" class="empty-state">
            No materials requested yet. Add items above if needed.
          </div>

          <div v-else class="materials-stack">
            <div v-for="item in materials" :key="item.id" class="material-chip">
              <div class="material-info">
                <span class="material-name">{{ item.name }}</span>
                <span class="material-qty">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <button
                type="button"
                class="btn-remove-item"
                @click="removeMaterial(item.id)"
                title="Remove item"
              >
                <Trash2 :size="14" color="#E53935" />
              </button>
            </div>
          </div>
        </div>

        <!-- Action Group -->
        <div class="action-group">
          <button type="button" class="btn-submit" @click="handlePublish">
            <Check :size="18" color="#FFFFFF" />
            <span>Publish Event & Request</span>
          </button>
          <button type="button" class="btn-cancel" @click="isOpen = false">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>
<style scoped>
/* Reset & Dialog Overlay */
.modal-backdrop {
  border: none;
  padding: 0;
  background: transparent;
  max-width: 100vw;
  max-height: 100vh;
}

.modal-backdrop::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

/* Modal Outer Card */
.materials-modal-card {
  width: 680px;
  padding: 32px;
  background: #ffffff;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

/* Header */
.header-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrap {
  width: 40px;
  height: 40px;
  background: rgba(119, 135, 50, 0.10);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 20px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  line-height: 1.2;
}

.header-subtitle {
  margin: 2px 0 0 0;
  color: #8F9A8F;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
}

.btn-close {
  width: 32px;
  height: 32px;
  background: #F7F8F6;
  border: none;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-close:hover {
  background: #E4E7E3;
}

.header-divider {
  width: 100%;
  height: 1px;
  background-color: #E4E7E3;
}

/* Event Summary Preview Card */
.event-summary-card {
  background: #F7F8F6;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
  padding: 14px 16px;
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-badge {
  align-self: flex-start;
  background: rgba(119, 135, 50, 0.12);
  color: #778732;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.summary-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.summary-meta {
  display: flex;
  gap: 16px;
  color: #525A52;
  font-size: 12px;
  font-family: 'Geist', sans-serif;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Material Add Form */
.add-material-form {
  background: #F7F8F6;
  border: 1px solid #E4E7E3;
  border-radius: 12px;
  padding: 16px;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flex-1 {
  flex: 1;
}

.flex-2 {
  flex: 2;
}

.field-label {
  color: #1A1D1A;
  font-size: 12px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.input-box {
  width: 100%;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #E4E7E3;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  color: #1A1D1A;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.input-box:focus {
  border-color: #778732;
}

.btn-add-item {
  height: 40px;
  width: 40px;
  background: #778732;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn-add-item:hover:not(:disabled) {
  background: #65732A;
}

.btn-add-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Material Items Stack */
.materials-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #8F9A8F;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  border: 1px dashed #E4E7E3;
  border-radius: 8px;
}

.materials-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.material-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #E4E7E3;
  border-radius: 8px;
}

.material-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.material-name {
  color: #1A1D1A;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 500;
}

.material-qty {
  color: #778732;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  background: rgba(119, 135, 50, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.btn-remove-item {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.btn-remove-item:hover {
  background: rgba(229, 57, 53, 0.1);
}

/* Actions Group */
.action-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: #778732;
  color: #ffffff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-submit:hover {
  background: #65732A;
}

.btn-cancel {
  background: transparent;
  border: none;
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.btn-cancel:hover {
  color: #1A1D1A;
}
</style>
