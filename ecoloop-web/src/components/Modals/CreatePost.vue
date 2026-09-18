<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '../../composables/useAuth' // Adjust path if necessary

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'publish', newPost: { category: string; title: string; description: string; images: string[] }): void
}>()

// Form States
const selectedCategory = ref('Gardening')
const title = ref('')
const description = ref('')
const imagePreviews = ref<string[]>([])
const imageFiles = ref<File[]>([]) // NEW: Stores the actual files for upload
const fileInputRef = ref<HTMLInputElement | null>(null)
const isSubmitting = ref(false) // NEW: UI loading state

const categories = [
  'Gardening',
  'Upcycling',
  'Composting',
  'Crafts & DIY',
  'Zero Waste'
]

// Modal visibility helpers
function closeModal() {
  if (isSubmitting.value) return // Prevent closing while uploading
  emit('update:modelValue', false)
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal()
  }
}

// Photo Upload Handlers
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  files.forEach((file) => {
    // Store the actual file for Supabase
    imageFiles.value.push(file)

    // Generate local preview for the UI
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
  imageFiles.value.splice(index, 1) // Keep both arrays in sync
}

// Form Submission
async function handleSubmit() {
  if (!title.value.trim() || !description.value.trim()) return

  isSubmitting.value = true
  const uploadedUrls: string[] = []

  try {
    // 1. Upload all images to Supabase Storage
    for (const file of imageFiles.value) {
      const fileExt = file.name.split('.').pop()
      // Generate a random filename to avoid collisions
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `post-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images') // The name of your Supabase Storage bucket
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError.message)
        continue // Skip this image and continue, or throw an error
      }

      // 2. Get the public URL for the database
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    // 3. Emit the data with the live URLs
    emit('publish', {
      category: selectedCategory.value,
      title: title.value,
      description: description.value,
      images: uploadedUrls
    })

    // 4. Reset & close
    title.value = ''
    description.value = ''
    imagePreviews.value = []
    imageFiles.value = []
    emit('update:modelValue', false) // Use emit directly to bypass `isSubmitting` check

  } catch (error) {
    console.error('Submission failed:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle Hooks for Escape key listener
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

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

          <!-- Header -->
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

            <!-- Category -->
            <div class="form-group">
              <label for="post-category">Category</label>
              <div class="select-wrapper">
                <select id="post-category" v-model="selectedCategory" class="custom-select">
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
                <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <!-- Post Title -->
            <div class="form-group">
              <label for="post-title">Post Title</label>
              <input
                id="post-title"
                v-model="title"
                type="text"
                class="form-input"
                placeholder="Need leftover cardboard boxes for community garden mulch"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="post-desc">Description</label>
              <textarea
                id="post-desc"
                v-model="description"
                class="form-textarea"
                placeholder="We are setting up sheet mulch beds for the local school garden this weekend. Looking for unprinted corrugated cardboard..."
                required
              ></textarea>
            </div>

            <!-- Photos -->
            <div class="form-group">
              <label>Photos</label>
              <div class="photo-grid">

                <!-- Upload Button -->
                <button type="button" class="upload-box" @click="triggerFileInput">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Upload Images</span>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden-file-input"
                    @change="handleFileUpload"
                  />
                </button>

                <!-- Photo Thumbnails -->
                <div
                  v-for="(img, idx) in imagePreviews"
                  :key="idx"
                  class="thumbnail-box"
                >
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

            <!-- Action Buttons -->
            <div class="action-group">
                <button
                type="submit"
                class="submit-btn"
                :disabled="isSubmitting"
                :style="{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }"
                >
                <!-- Loading Spinner when submitting -->
                <svg v-if="isSubmitting" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>

                <!-- Normal icon when not submitting -->
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>

                <span>{{ isSubmitting ? 'Publishing...' : 'Publish Post' }}</span>
                </button>

                <button
                type="button"
                class="cancel-btn"
                @click="closeModal"
                :disabled="isSubmitting"
                >
                Cancel
                </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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

.create-post-modal {
  width: 100%;
  max-width: 720px;
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

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-wrap {
  width: 36px;
  height: 36px;
  background: rgba(119, 135, 50, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-group h2 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1d1a;
}

.close-btn {
  width: 36px;
  height: 32px;
  background: #f7f8f6;
  border: none;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.close-btn:hover {
  background: #e4e7e3;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #e4e7e3;
}

/* Form Styles */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1a1d1a;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-select {
  width: 100%;
  padding: 12px 16px;
  background: #f7f8f6;
  border: 1.5px solid #778732;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1a1d1a;
  appearance: none;
  outline: none;
  cursor: pointer;
}

.chevron-icon {
  position: absolute;
  right: 16px;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: #1a1d1a;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #778732;
}

.form-textarea {
  width: 100%;
  height: 120px;
  padding: 12px 16px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1d1a;
  outline: none;
  resize: vertical;
}

/* Photos Section */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
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

/* Action Buttons */
.action-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #778732;
  border: none;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.submit-btn:hover {
  background: #65732a;
}

.cancel-btn {
  background: transparent;
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

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
