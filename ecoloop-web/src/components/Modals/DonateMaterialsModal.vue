<script setup lang="ts">
import { ref, watch } from 'vue'

// Vue 3.4+ two-way binding macro
const isOpen = defineModel<boolean>({ default: false })

const dialogRef = ref<HTMLDialogElement | null>(null)

// Synchronize state with native HTML dialog methods
watch(isOpen, (open) => {
  if (open) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
})

function handleBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) {
    isOpen.value = false
  }
}

// Form state
const isSelectOpen = ref(false)
const selectedMaterial = ref('Glass Bottles (wine/juice)')
const quantity = ref(5)
const title = ref('Wine bottles from local restaurant')
const description = ref('Clean wine bottles, labels removed. Mix of clear and green glass.')
const pickupPreference = ref('deliver')

function incrementQuantity() {
  quantity.value++
}

function decrementQuantity() {
  if (quantity.value > 1) quantity.value--
}

function selectMaterial(material: string) {
  selectedMaterial.value = material
  isSelectOpen.value = false
}

function handleSubmit() {
  // Handle donation submission logic here
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
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <div class="icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <h2>Donate Materials</h2>
          </div>
          <button class="close-btn" @click="isOpen = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Body Form Grid -->
        <div class="form-grid">
          <!-- Left Column -->
          <div class="form-column">
            <!-- Select Material -->
            <div class="form-group">
              <label>Select Material</label>
              <div class="select-box" @click="isSelectOpen = !isSelectOpen">
                <div class="select-info">
                  <span class="material-name">{{ selectedMaterial }}</span>
                  <span class="material-stats">25 bottles needed • 18 donated</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>

              <!-- Dropdown Options -->
              <div v-if="isSelectOpen" class="dropdown-list">
                <div class="dropdown-item" @click="selectMaterial('Gravel / Pebbles')">
                  <span class="item-name">Gravel / Pebbles</span>
                  <span class="item-stats">5 bags needed • 3 donated</span>
                </div>
                <div class="dropdown-item" @click="selectMaterial('Potting Soil')">
                  <span class="item-name">Potting Soil</span>
                  <span class="item-stats">3 bags needed • 2 donated</span>
                </div>
              </div>
            </div>

            <!-- Quantity -->
            <div class="form-group">
              <label>Quantity to Donate</label>
              <div class="quantity-picker">
                <button type="button" class="qty-btn" @click="decrementQuantity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2">
                    <path d="M5 12h14"/>
                  </svg>
                </button>
                <span class="qty-display">+ {{ quantity }} bottles</span>
                <button type="button" class="qty-btn" @click="incrementQuantity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1D1A" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Donation Title -->
            <div class="form-group">
              <label>Donation Title</label>
              <input v-model="title" type="text" class="form-input" placeholder="Enter title" />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description of Materials</label>
              <textarea v-model="description" class="form-textarea" placeholder="Describe the materials..."></textarea>
            </div>
          </div>

          <!-- Right Column -->
          <div class="form-column">
            <!-- Photos -->
            <div class="form-group">
              <label>Photos of Materials</label>
              <div class="photos-grid">
                <div class="upload-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  <span>Add photos of your materials</span>
                </div>
                <div class="photo-preview">
                  <img src="https://placehold.co/137x96" alt="Uploaded material preview" />
                  <button type="button" class="remove-photo">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Location -->
            <div class="form-group">
              <div class="label-row">
                <label>Drop-off / Pickup Location</label>
                <button type="button" class="text-btn">Use current location</button>
              </div>
              <div class="map-preview">
                <img src="https://placehold.co/320x120" alt="Location Map" />
              </div>
              <div class="location-address">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>847 NE Prescott St, Portland, OR</span>
              </div>
            </div>

            <!-- Pickup Preferences -->
            <div class="form-group">
              <label>Pickup Preferences</label>
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
          <button type="button" class="submit-btn" @click="handleSubmit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Confirm Donation
          </button>
          <button type="button" class="cancel-btn" @click="isOpen = false">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
/* ==========================================================================
   MODAL BACKDROP & CONTAINER
   ========================================================================== */
.modal-backdrop {
  border: none;
  background: transparent;
  padding: 0;
  max-width: none;
  max-height: none;
  overflow: visible;
}

.modal-backdrop::backdrop {
  background: rgba(26, 29, 26, 0.4);
  backdrop-filter: blur(4px);
}

.modal-container {
  width: 720px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

/* ==========================================================================
   HEADER
   ========================================================================== */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-box {
  padding: 8px;
  background: rgba(119, 135, 50, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-title h2 {
  margin: 0;
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 700;
}

.close-btn {
  width: 36px;
  height: 32px;
  background: #f7f8f6;
  border: none;
  border-radius: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.close-btn:hover {
  background: #e5e7eb;
}

.divider {
  width: 100%;
  height: 1px;
  background: #e4e7e3;
}

/* ==========================================================================
   FORM & GRID
   ========================================================================== */
.form-grid {
  display: flex;
  gap: 24px;
  width: 100%;
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-group label {
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
}

/* Custom Select Box */
.select-box {
  padding: 12px 16px;
  background: #f7f8f6;
  border: 1.5px solid #778732;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.select-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-name {
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
}

.material-stats {
  color: #778732;
  font-size: 12px;
}

.dropdown-list {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0px 4px 12px rgba(26, 29, 26, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
}

.dropdown-item {
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f0f7f0;
}

.item-name {
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.item-stats {
  color: #8f9a8f;
  font-size: 11px;
}

/* Quantity Picker */
.quantity-picker {
  padding: 12px 16px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.qty-display {
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
}

/* Inputs & Textareas */
.form-input,
.form-textarea {
  width: 100%;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  color: #1a1d1a;
  outline: none;
  box-sizing: border-box;
}

.form-textarea {
  height: 80px;
  resize: none;
  line-height: 1.5;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #778732;
}

/* Photos Grid */
.photos-grid {
  display: flex;
  gap: 12px;
}

.upload-box {
  flex: 1;
  height: 96px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 16px;
  text-align: center;
}

.upload-box span {
  color: #8f9a8f;
  font-size: 11px;
  font-weight: 500;
}

.photo-preview {
  flex: 1;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(26, 29, 26, 0.8);
  border: none;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

/* Location */
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-btn {
  background: none;
  border: none;
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.map-preview {
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.map-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.location-address {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #525a52;
  font-size: 13px;
}

/* Radio Group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  padding: 10px 14px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.radio-option.active {
  background: rgba(119, 135, 50, 0.1);
  border-color: #778732;
}

.radio-dot {
  width: 20px;
  height: 20px;
  background: #ffffff;
  border: 1.5px solid #e4e7e3;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.radio-option.active .radio-dot {
  border: 2px solid #778732;
}

.radio-option.active .radio-dot::after {
  content: '';
  width: 10px;
  height: 10px;
  background: #778732;
  border-radius: 50%;
}

.option-label {
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.radio-option.active .option-label {
  color: #1a1d1a;
  font-weight: 600;
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

/* ==========================================================================
   FOOTER ACTIONS
   ========================================================================== */
.modal-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #778732;
  border: none;
  border-radius: 24px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.submit-btn:hover {
  background: #65732a;
}

.cancel-btn {
  background: none;
  border: none;
  color: #8f9a8f;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.cancel-btn:hover {
  color: #1a1d1a;
}

/* ==========================================================================
   RESPONSIVE (Mobile Adaptation)
   ========================================================================== */
@media (max-width: 640px) {
  .form-grid {
    flex-direction: column;
  }
}
</style>
