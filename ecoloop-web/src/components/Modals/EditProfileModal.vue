<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updatedProfile: { fullName: string; about: string; location: string; contact: string; avatarPreview: string; avatarFile: File | null }): void
}>()

// Form States
const fullName = ref('')
const about = ref('')
const location = ref('')
const contact = ref('')
const avatarPreview = ref('')
const avatarFile = ref<File | null>(null) // <-- This is the missing piece!
const fileInputRef = ref<HTMLInputElement | null>(null)

// Sync initial data when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'

    // Pre-fill the form with current profile data
    if (props.initialData) {
      fullName.value = props.initialData.full_name || ''
      location.value = props.initialData.location || ''
      contact.value = props.initialData.contact_number || ''
      about.value = props.initialData.profile_data?.about || ''
      avatarPreview.value = props.initialData.profile_data?.Avatar || ''
      avatarFile.value = null // Reset the physical file queue on open
    }
  } else {
    document.body.style.overflow = ''
  }
})

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
    avatarFile: avatarFile.value
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

            <!-- Avatar -->
            <div class="form-group avatar-group">
              <label>Profile Picture</label>
              <div class="avatar-upload-container">
                <div v-if="avatarPreview" class="avatar-preview-box">
                  <img :src="avatarPreview" alt="Avatar preview" />
                  <button type="button" class="delete-photo-btn" @click="removeImage">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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

            <!-- Location & Contact (Side by side) -->
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
/* Core Modal Styles (Reused from CreatePostModal) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 29, 26, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}

.edit-profile-modal {
  width: 100%;
  max-width: 520px; /* Slightly narrower than a post modal */
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header { display: flex; align-items: center; justify-content: space-between; }
.title-group { display: flex; align-items: center; gap: 10px; }
.icon-wrap { width: 36px; height: 36px; background: rgba(119, 135, 50, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.title-group h2 { margin: 0; font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: #1a1d1a; }
.close-btn { width: 36px; height: 32px; background: #f7f8f6; border: none; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease; }
.close-btn:hover { background: #e4e7e3; }
.divider { width: 100%; height: 1px; background-color: #e4e7e3; }

.modal-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-row { display: flex; gap: 16px; }
.half-width { flex: 1; }
.form-group label { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #1a1d1a; }

.form-input { width: 100%; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; outline: none; transition: 0.15s; }
.form-textarea { width: 100%; height: 100px; padding: 12px 16px; background: #f7f8f6; border: 1px solid #e4e7e3; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; outline: none; }
.form-input:focus, .form-textarea:focus { border-color: #778732; }

/* Avatar Specific */
.avatar-group { align-items: center; }

/* 1. Removed border and overflow:hidden from the wrapper */
.avatar-preview-box { position: relative; width: 96px; height: 96px; }

/* 2. Moved the round border to the image itself */
.avatar-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #e4e7e3;
  box-sizing: border-box;
}

.upload-box.avatar-upload { width: 96px; height: 96px; border-radius: 50%; background: #f7f8f6; border: 1px dashed #e4e7e3; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.15s; }
.upload-box.avatar-upload:hover { background: #edf0ec; }
.upload-box span { font-size: 11px; font-weight: 500; color: #8f9a8f; margin-top: 4px; }
.hidden-file-input { display: none; }

/* 3. Shifted the button slightly and made it pop out nicely */
.delete-photo-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 26px;
  height: 26px;
  background: rgba(26, 29, 26, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.15s ease;
}

.delete-photo-btn:hover {
  transform: scale(1.1);
}

/* Actions */
.action-group { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 8px; }
.submit-btn { width: 100%; padding: 14px; background: #778732; border: none; border-radius: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
.submit-btn:hover { background: #65732a; }
.cancel-btn { background: transparent; border: none; color: #8f9a8f; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; text-decoration: underline; cursor: pointer; }
.cancel-btn:hover { color: #1a1d1a; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
