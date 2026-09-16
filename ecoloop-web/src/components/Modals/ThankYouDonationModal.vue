<script setup lang="ts">
import { ref, watch } from 'vue'

// Vue 3.4+ v-model wrapper for open/close state
const isOpen = defineModel<boolean>({ default: false })

// Props for custom donation details (falls back to Figma defaults if empty)
const props = withDefaults(
  defineProps<{
    quantity?: number | string
    materialName?: string
    projectName?: string
    authorUsername?: string
  }>(),
  {
    quantity: 5,
    materialName: 'glass bottles',
    projectName: 'outdoor potting project',
    authorUsername: 'u/nature_craft'
  }
)

const emit = defineEmits<{
  (e: 'view-donations'): void
  (e: 'back-to-post'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

// Synchronize state with native HTML dialog element
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

function handleViewDonations() {
  emit('view-donations')
  isOpen.value = false
}

function handleBackToPost() {
  emit('back-to-post')
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
      <div class="donation-success-card">
        <!-- Checkmark Badge -->
        <div class="checkmark-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <!-- Title Group -->
        <div class="title-group">
          <h2 class="title">Thank You for Donating!</h2>
          <p class="subtitle">
            You will receive confirmation on your notifications page.
          </p>
        </div>

        <!-- Summary Box -->
        <div class="summary-box">
          <div class="package-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <p class="summary-text">
            You donated <span class="highlight">{{ props.quantity }} {{ props.materialName }}</span> to the {{ props.projectName }} by <span class="author">{{ props.authorUsername }}</span>
          </p>
        </div>

        <!-- Button Group -->
        <div class="button-group">
          <button type="button" class="btn-primary" @click="handleViewDonations">
            View My Donations
          </button>
          <button type="button" class="btn-secondary" @click="handleBackToPost">
            Back to Post
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
/* Native HTML <dialog> resets & overlay */
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

/* Modal Box Container */
.donation-success-card {
  width: 420px;
  padding: 32px;
  background: #ffffff;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.12);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-sizing: border-box;
}

/* Badge Icon */
.checkmark-badge {
  width: 72px;
  height: 72px;
  background: rgba(119, 135, 50, 0.10);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Typography Headings */
.title-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title {
  margin: 0;
  text-align: center;
  color: #1A1D1A;
  font-size: 24px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  line-height: 1.2;
}

.subtitle {
  margin: 0;
  text-align: center;
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
  line-height: 1.4;
}

/* Summary Card */
.summary-box {
  width: 100%;
  padding: 16px;
  background: #F7F8F6;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.package-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-text {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
  line-height: 1.5;
}

.summary-text .highlight {
  color: #1A1D1A;
  font-weight: 700;
}

.summary-text .author {
  color: #778732;
  font-weight: 700;
}

/* Actions */
.button-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.btn-primary {
  width: 100%;
  padding: 14px 0;
  background: #778732;
  border: none;
  border-radius: 24px;
  color: #ffffff;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: transparent;
  border: none;
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px;
}

.btn-secondary:hover {
  color: #525A52;
}
</style>
