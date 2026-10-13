<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '../../composables/useAuth'

const props = defineProps<{
  modelValue: boolean
  userId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submitted'): void
}>()

const files = ref<File[]>([])
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    files.value = []
    errorMessage.value = ''
  }
})

function close() {
  if (!isSubmitting.value) emit('update:modelValue', false)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  files.value = Array.from(input.files || [])
}

async function handleSubmit() {
  if (files.value.length === 0) {
    errorMessage.value = 'Please select at least one file.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const urls: string[] = []
    for (const file of files.value) {
      const ext = file.name.split('.').pop()
      const path = `verification/${props.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }

    const { error } = await supabase.rpc('submit_org_verification', { doc_urls: urls })
    if (error) throw error

    emit('submitted')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.message || 'Upload failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>Get Verified</h2>
            <button type="button" class="close-btn" @click="close">✕</button>
          </div>

          <p class="modal-desc">
            Upload files that prove your organization is legitimate (e.g. SEC/DTI registration, permits, or IDs).
            An admin will review them.
          </p>

          <form class="modal-form" @submit.prevent="handleSubmit">
            <label class="upload-box">
              <input type="file" accept="image/*,application/pdf" multiple @change="onFileChange" />
              <span v-if="files.length === 0">Click to upload files</span>
              <span v-else>{{ files.length }} file(s) selected</span>
            </label>

            <ul v-if="files.length" class="file-list">
              <li v-for="f in files" :key="f.name">{{ f.name }}</li>
            </ul>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

            <div class="actions">
              <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="close">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Uploading...' : 'Submit for Review' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(26, 29, 26, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 16px; }
.modal-card { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 16px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-header h2 { margin: 0; font-size: 20px; color: #1A1D1A; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #8F9A8F; }
.modal-desc { margin: 0; font-size: 14px; color: #5C665C; }
.modal-form { display: flex; flex-direction: column; gap: 12px; }
.upload-box { border: 2px dashed #C9D1C5; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; color: #778732; font-weight: 500; }
.upload-box:hover { background: #F7F8F6; }
.upload-box input { display: none; }
.file-list { margin: 0; padding-left: 18px; font-size: 13px; color: #5C665C; }
.error { margin: 0; color: #D64545; font-size: 13px; }
.actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-primary { background: #778732; color: white; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: 600; }
.btn-secondary { background: #F0F2EE; color: #1A1D1A; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; }
.btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
