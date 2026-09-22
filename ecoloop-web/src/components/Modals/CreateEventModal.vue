<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Calendar,
  X,
  ChevronDown,
  Camera,
  MapPin,
  ChevronRight
} from 'lucide-vue-next'
import RequestMaterialsModal from './RequestMaterialsModal.vue'

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
  organizer: ''
})

const categories = [
  'Composting',
  'Clean-Up Drive',
  'Recycling Workshop',
  'Upcycling Event',
  'Tree Planting'
]

// Dynamic OpenStreetMap embed URL based on entered location
const mapEmbedUrl = computed(() => {
  if (!formData.value.location.trim()) return ''
  const query = encodeURIComponent(formData.value.location)
  return `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`
})

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

function triggerFileInput() {
  fileInputRef.value?.click()
}

const selectedFile = ref<File | null>(null)

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]

    // 2. Save the RAW file object to upload later
    selectedFile.value = file

    // Keep the blob ONLY for the UI preview in this modal
    formData.value.bannerImage = URL.createObjectURL(file)
  }
}

function removeBanner() {
  formData.value.bannerImage = ''
  // 3. Clear the raw file if they remove the image
  selectedFile.value = null
}

function handleSubmit() {
  // 4. Attach the rawFile to the draft data so it gets passed to the next modal
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
              <div class="map-mockup-wrapper">
                <iframe
                  v-if="mapEmbedUrl"
                  :src="mapEmbedUrl"
                  class="map-iframe"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
                <div v-else class="map-placeholder">
                  <MapPin :size="20" color="#778732" />
                  <span>Enter location to display map</span>
                </div>
              </div>
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
    background:
    transparent;
    max-width:
    100vw;
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
.map-mockup-wrapper { width: 100%; height: 120px; margin-top: 8px; overflow: hidden; border-radius: 8px; border: 1px solid #E4E7E3; background: #EAECE8; display: flex; justify-content: center; align-items: center; position: relative; }
.map-iframe { width: 100%; height: 100%; border: none; }
.map-placeholder { display: flex; align-items: center; gap: 8px; color: #8F9A8F; font-size: 13px; font-family: 'Geist', sans-serif; font-weight: 500; }
.action-group { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.btn-submit { width: 100%; padding: 14px 0; background: #778732; border: none; border-radius: 24px; display: flex; justify-content: center; align-items: center; gap: 8px; color: #ffffff; font-size: 16px; font-family: 'Outfit', sans-serif; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
.btn-submit:hover { background: #65732A; }
.btn-cancel { background: transparent; border: none; color: #8F9A8F; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 600; text-decoration: underline; cursor: pointer; }
.btn-cancel:hover { color: #1A1D1A; }
</style>
