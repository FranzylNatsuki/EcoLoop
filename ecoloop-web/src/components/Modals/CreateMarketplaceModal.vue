<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImagePlus, ShoppingBag, X } from 'lucide-vue-next'

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'publish', payload: any): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const title = ref('')
const description = ref('')
const category = ref('Plastics')
const pricingType = ref<'For Sale' | 'Free/Donation'>('For Sale')
const pricingStructure = ref<'Per Unit / kg' | 'Bulk Bundle (e.g., per 20 pcs)' | 'Total Lot Price (Price for All)'>('Per Unit / kg')
const price = ref<number | null>(null)
const quantity = ref<number | null>(null)
const quantityUnit = ref('pcs')
const imageFiles = ref<File[]>([])

const categories = ['Plastics', 'Glass', 'Paper/Cardboard', 'Metal', 'Electronics']
const pricingStructures = [
  'Per Unit / kg',
  'Bulk Bundle (e.g., per 20 pcs)',
  'Total Lot Price (Price for All)',
]

watch(isOpen, (open) => {
  if (open) {
    dialogRef.value?.showModal()
  } else if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}, { immediate: true })

function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) closeModal()
}

function closeModal() {
  isOpen.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  imageFiles.value = input.files ? Array.from(input.files) : []
}

function resetForm() {
  title.value = ''
  description.value = ''
  category.value = 'Plastics'
  pricingType.value = 'For Sale'
  pricingStructure.value = 'Per Unit / kg'
  price.value = null
  quantity.value = null
  quantityUnit.value = 'pcs'
  imageFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleSubmit() {
  if (!title.value.trim() || !description.value.trim()) return

  emit('publish', {
    title: title.value.trim(),
    description: description.value.trim(),
    category: category.value,
    type: 'marketplace',      // <--- ADD THIS LINE
    postType: 'marketplace',  // <--- ADD THIS LINE FOR BACKWARD COMPATIBILITY
    pricingType: pricingType.value,
    pricingStructure: pricingStructure.value,
    price: price.value,
    quantity: quantity.value,
    quantityUnit: quantityUnit.value,
    images: imageFiles.value,
    timestamp: new Date().toISOString(),
  })

  resetForm()
  closeModal()
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="modal-backdrop"
      @cancel="closeModal"
      @click="handleBackdropClick"
    >
      <form class="marketplace-card" @submit.prevent="handleSubmit">
        <div class="header-row">
          <div class="title-group">
            <div class="icon-container header-icon">
              <ShoppingBag :size="20" color="#778732" />
            </div>
            <h2 class="header-title">Create Marketplace Listing</h2>
          </div>
          <button type="button" class="btn-close" aria-label="Close modal" @click="closeModal">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <div class="form-group">
          <label for="listing-title">Listing Title</label>
          <input
            id="listing-title"
            v-model="title"
            class="form-control"
            type="text"
            placeholder="e.g., Clean plastic bottles"
            required
          />
        </div>

        <div class="form-group">
          <label for="listing-description">Description</label>
          <textarea
            id="listing-description"
            v-model="description"
            class="form-control textarea-control"
            rows="4"
            placeholder="Add details about the materials, condition, and pickup or delivery options"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="material-category">Material Category</label>
          <select id="material-category" v-model="category" class="form-control">
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>

        <fieldset class="form-group option-group">
          <legend>Price Type</legend>
          <div class="radio-options">
            <label class="radio-card" :class="{ active: pricingType === 'For Sale' }">
              <input v-model="pricingType" type="radio" value="For Sale" />
              <span>For Sale</span>
            </label>
            <label class="radio-card" :class="{ active: pricingType === 'Free/Donation' }">
              <input v-model="pricingType" type="radio" value="Free/Donation" />
              <span>Free/Donation</span>
            </label>
          </div>
        </fieldset>

        <div class="pricing-grid">
          <div class="form-group full-width">
            <label for="pricing-structure">Pricing Structure</label>
            <select id="pricing-structure" v-model="pricingStructure" class="form-control">
              <option v-for="item in pricingStructures" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="listing-price">Price</label>
            <input
              id="listing-price"
              v-model.number="price"
              class="form-control"
              type="number"
              min="0"
              step="0.01"
              placeholder="₱15"
              :disabled="pricingType === 'Free/Donation'"
            />
          </div>

          <div class="form-group">
            <label for="listing-quantity">Quantity</label>
            <div class="quantity-input">
              <input id="listing-quantity" v-model.number="quantity" class="form-control" type="number" min="0" placeholder="50" />
              <select v-model="quantityUnit" class="unit-select" aria-label="Quantity unit">
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="items">items</option>
                <option value="lots">lots</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Images</label>
          <button type="button" class="upload-placeholder" @click="triggerFileInput">
            <ImagePlus :size="22" color="#778732" />
            <span>{{ imageFiles.length ? `${imageFiles.length} image(s) selected` : 'Add photos of your materials' }}</span>
            <small>PNG or JPG</small>
          </button>
          <input ref="fileInputRef" class="hidden-input" type="file" accept="image/png,image/jpeg" multiple @change="handleFileUpload" />
        </div>

        <div class="footer-actions">
          <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
          <button type="submit" class="btn-submit">Publish Listing</button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  border: none;
  padding: 0;
  background: transparent;
  max-width: 100vw;
  max-height: 100vh;
}

.modal-backdrop::backdrop {
  background: rgba(26, 29, 26, 0.45);
  backdrop-filter: blur(4px);
}

.marketplace-card {
  width: min(620px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 28px;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(26, 29, 26, 0.15);
  box-sizing: border-box;
  color: #1a1d1a;
  font-family: 'Outfit', 'Geist', sans-serif;
}

.header-row,
.title-group,
.radio-options,
.footer-actions,
.quantity-input {
  display: flex;
  align-items: center;
}

.header-row,
.footer-actions { justify-content: space-between; }
.title-group { gap: 10px; }
.icon-container { display: flex; align-items: center; justify-content: center; background: rgba(119, 135, 50, 0.1); flex-shrink: 0; }
.header-icon { width: 40px; height: 40px; border-radius: 8px; }
.header-title { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; }
.btn-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: #f7f8f6; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.header-divider { width: 100%; height: 1px; margin: 20px 0; background: #e4e7e3; }
.form-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
.form-group label,
.option-group legend { font-size: 13px; font-weight: 700; }
.form-control,
.unit-select { width: 100%; padding: 11px 12px; border: 1px solid #d9ded7; border-radius: 8px; background: #fff; color: #1a1d1a; font: inherit; box-sizing: border-box; }
.form-control:focus,
.unit-select:focus { outline: 2px solid rgba(119, 135, 50, .3); border-color: #778732; }
.textarea-control { resize: vertical; min-height: 100px; }
.option-group { padding: 0; border: 0; }
.option-group legend { padding: 0; margin-bottom: 8px; }
.radio-options { gap: 10px; }
.radio-card { flex: 1; padding: 11px 12px; border: 1px solid #d9ded7; border-radius: 8px; color: #697067; cursor: pointer; }
.radio-card.active { border-color: #778732; background: rgba(119, 135, 50, .08); color: #1a1d1a; }
.radio-card input { accent-color: #778732; margin-right: 7px; }
.pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.full-width { grid-column: 1 / -1; }
.quantity-input { gap: 8px; }
.quantity-input .form-control { flex: 1; }
.unit-select { width: 90px; }
.upload-placeholder { width: 100%; min-height: 76px; padding: 14px; border: 1px dashed #aeb9a2; border-radius: 10px; background: #f7f8f6; color: #697067; display: flex; align-items: center; justify-content: center; gap: 9px; font: inherit; cursor: pointer; }
.upload-placeholder small { color: #8a9388; }
.hidden-input { display: none; }
.footer-actions { gap: 12px; margin-top: 8px; }
.btn-cancel,
.btn-submit { flex: 1; padding: 12px 16px; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer; }
.btn-cancel { border: 1px solid #d9ded7; background: #fff; color: #1a1d1a; }
.btn-submit { border: 1px solid #778732; background: #778732; color: #fff; }
.btn-submit:hover { background: #657329; }

@media (max-width: 560px) {
  .marketplace-card { padding: 20px; }
  .pricing-grid { grid-template-columns: 1fr; }
  .full-width { grid-column: auto; }
  .radio-options { flex-direction: column; align-items: stretch; }
}
</style>
