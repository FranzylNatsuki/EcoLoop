<script setup lang="ts">
import { ref, watch } from 'vue'
import { Edit3, Megaphone, Calendar, ChevronRight, X } from 'lucide-vue-next'
import CreateEventModal from './CreateEventModal.vue'
import CreateCauseModal from './CreatePost.vue'
import { usePosts, type CreatePostPayload } from '../../composables/usePosts'
import { useEvents } from '../../composables/useEvents'

const { addPost } = usePosts()
const { addEvent } = useEvents()

function isEventPayload(payload: any): payload is { event: any; materials: any[] } {
  return payload && typeof payload === 'object' && 'event' in payload && 'materials' in payload
}

// Controls visibility of THIS chooser modal
const isOpen = defineModel<boolean>({ default: false })

// FIX: Added selectCause and selectEvent to the allowed emits
const emit = defineEmits<{
  (e: 'publish', payload: any): void
  (e: 'selectCause'): void
  (e: 'selectEvent'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

// Child modal states for direct chain-loading
const isEventModalOpen = ref(false)
const isCauseModalOpen = ref(false)

// Native dialog visibility sync
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

function handleSelectCause() {
  isOpen.value = false
  isCauseModalOpen.value = true
  emit('selectCause') // Let the parent component know!
}

function handleSelectEvent() {
  isOpen.value = false
  isEventModalOpen.value = true
  emit('selectEvent') // Let the parent component know!
}

async function handlePublish(payload: any) {
  console.log('1. Payload received from form:', payload)

  if (isEventPayload(payload)) {
    console.log('2a. Saving Event to database...')
    await addEvent(payload)
  } else {
    console.log('2b. Saving Post to database...')
    await addPost(payload as CreatePostPayload)
  }

  console.log('3. Database write complete. Closing modals.')

  // Close the child modal
  isCauseModalOpen.value = false
  isEventModalOpen.value = false

  // Tell the parent (CreatePostButton) to close the main backdrop
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
      <div class="chooser-card">
        <!-- Header -->
        <div class="header-row">
          <div class="title-group">
            <div class="icon-container header-icon">
              <Edit3 :size="20" color="#778732" />
            </div>
            <h2 class="header-title">Create New</h2>
          </div>
          <button type="button" class="btn-close" @click="isOpen = false">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <!-- Options Stack -->
        <div class="options-stack">
          <!-- Cause Request Post -->
          <button type="button" class="selection-card" @click="handleSelectCause">
            <div class="icon-container option-icon">
              <Megaphone :size="20" color="#778732" />
            </div>
            <div class="card-text-block">
              <span class="card-title">Cause Request Post</span>
              <span class="card-description">
                Share a request for materials, resources, or help with your recycling project
              </span>
            </div>
            <ChevronRight :size="16" class="chevron-icon" />
          </button>

          <!-- Event Post -->
          <button type="button" class="selection-card" @click="handleSelectEvent">
            <div class="icon-container option-icon">
              <Calendar :size="20" color="#778732" />
            </div>
            <div class="card-text-block">
              <span class="card-title">Event</span>
              <span class="card-description">
                Organize a community clean-up, workshop, or recycling drive
              </span>
            </div>
            <ChevronRight :size="16" class="chevron-icon" />
          </button>
        </div>

        <!-- Cancel Footer -->
        <button type="button" class="btn-cancel" @click="isOpen = false">
          Cancel
        </button>
      </div>
    </dialog>
  </Teleport>

  <!-- Next Steps in Chain -->
  <CreateCauseModal
    v-model="isCauseModalOpen"
    @publish="handlePublish"
  />

  <CreateEventModal
    v-model="isEventModalOpen"
    @publish="handlePublish"
  />
</template>

<style scoped>
/* Reset and Dialog Backdrop */
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
.chooser-card {
  width: 540px;
  padding: 28px;
  background: #ffffff;
  box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  gap: 10px;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(119, 135, 50, 0.10);
  flex-shrink: 0;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.header-title {
  margin: 0;
  color: #1A1D1A;
  font-size: 22px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  line-height: 1.2;
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

/* Selection Cards Stack */
.options-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selection-card {
  width: 100%;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1.5px solid #E4E7E3;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;
  box-sizing: border-box;
}

.selection-card:hover {
  border-color: #778732;
  background: #F7F8F6;
  transform: translateY(-1px);
}

.selection-card:hover .chevron-icon {
  color: #778732;
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.card-text-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  color: #1A1D1A;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.card-description {
  color: #8F9A8F;
  font-size: 13px;
  font-family: 'Geist', sans-serif;
  font-weight: 400;
  line-height: 1.4;
}

.chevron-icon {
  color: #8F9A8F;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

/* Footer Cancel */
.btn-cancel {
  width: 100%;
  background: transparent;
  border: none;
  padding-top: 8px;
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  text-align: center;
}

.btn-cancel:hover {
  color: #1A1D1A;
}
</style>
