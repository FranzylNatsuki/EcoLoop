<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Minus, Plus, ShoppingBag, X } from 'lucide-vue-next'

interface MarketplacePost {
  title?: string
  listingTitle?: string
  seller?: string
  sellerName?: string
  material?: string
  materialType?: string
  materials?: string[]
  materialOptions?: string[]
  unitPrice?: number | string
}

interface InquiryPayload {
  materialType: string
  quantity: number
  message: string
  timestamp: string
}

const props = defineProps<{
  post: MarketplacePost
}>()

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submitInquiry', payload: InquiryPayload): void
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const materialType = ref('')
const quantity = ref(1)
const message = ref('')

const listingTitle = computed(() => props.post.listingTitle ?? props.post.title ?? 'this listing')
const sellerName = computed(() => props.post.sellerName ?? props.post.seller ?? 'the seller')
const materialOptions = computed(() => {
  const options = props.post.materialOptions ?? props.post.materials
  return options?.length ? options : [props.post.materialType ?? props.post.material ?? '']
})
const unitPrice = computed(() => props.post.unitPrice ?? '—')

function resetForm() {
  materialType.value = materialOptions.value[0] ?? ''
  quantity.value = 1
  message.value = `Hi ${sellerName.value}! I'm interested in purchasing ${quantity.value} unit${quantity.value === 1 ? '' : 's'} of ${listingTitle.value}. Is this still available?`
}

watch(isOpen, (open) => {
  if (open) {
    resetForm()
    dialogRef.value?.showModal()
  } else if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}, { immediate: true })

watch(() => props.post, () => {
  if (isOpen.value) resetForm()
}, { deep: true })

function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) closeModal()
}

function closeModal() {
  isOpen.value = false
  emit('close')
}

function decrementQuantity() {
  quantity.value = Math.max(1, quantity.value - 1)
}

function incrementQuantity() {
  quantity.value += 1
}

function submitInquiry() {
  emit('submitInquiry', {
    materialType: materialType.value,
    quantity: quantity.value,
    message: message.value,
    timestamp: new Date().toISOString(),
  })
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
      <form class="inquiry-card" @submit.prevent="submitInquiry">
        <div class="header-row">
          <div class="title-group">
            <div class="icon-container header-icon">
              <ShoppingBag :size="20" color="#778732" />
            </div>
            <div>
              <h2 class="header-title">Request Materials</h2>
              <p class="header-subtitle">Contact {{ sellerName }} about this listing</p>
            </div>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal">
            <X :size="14" color="#1A1D1A" />
          </button>
        </div>

        <div class="header-divider"></div>

        <div class="listing-summary">
          <div>
            <span class="eyebrow">Marketplace listing</span>
            <h3>{{ listingTitle }}</h3>
          </div>
          <span class="price">{{ unitPrice }}</span>
        </div>

        <label class="field-label" for="material-type">Material type</label>
        <select id="material-type" v-model="materialType" class="field-control">
          <option v-for="option in materialOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>

        <div class="quantity-row">
          <label class="field-label" for="quantity">Quantity</label>
          <div class="quantity-control">
            <button type="button" aria-label="Decrease quantity" @click="decrementQuantity">
              <Minus :size="16" />
            </button>
            <input id="quantity" v-model.number="quantity" type="number" min="1" required />
            <button type="button" aria-label="Increase quantity" @click="incrementQuantity">
              <Plus :size="16" />
            </button>
          </div>
        </div>

        <label class="field-label" for="message">Message</label>
        <textarea id="message" v-model="message" class="field-control message-control" rows="4" required></textarea>

        <div class="footer-actions">
          <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
          <button type="submit" class="btn-submit">Send inquiry</button>
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

.inquiry-card {
  width: min(540px, calc(100vw - 32px));
  padding: 28px;
  background: #fff;
  border: none;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(26, 29, 26, 0.15);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
}

.header-row,
.title-group,
.quantity-row,
.footer-actions,
.listing-summary {
  display: flex;
  align-items: center;
}

.header-row,
.listing-summary,
.footer-actions {
  justify-content: space-between;
}

.title-group { gap: 10px; }

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(119, 135, 50, 0.1);
}

.header-icon { width: 40px; height: 40px; border-radius: 8px; }
.header-title { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; }
.header-subtitle { margin: 3px 0 0; color: #697067; font-size: 13px; }

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f7f8f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-divider { width: 100%; height: 1px; margin: 4px 0 8px; background: #e4e7e3; }

.listing-summary { padding: 14px 16px; border-radius: 10px; background: #f7f8f6; }
.listing-summary h3 { margin: 3px 0 0; font-size: 16px; }
.eyebrow { color: #778732; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.price { color: #778732; font-size: 16px; font-weight: 700; }
.field-label { margin-top: 6px; font-size: 13px; font-weight: 700; }

.field-control {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d9ded7;
  border-radius: 8px;
  background: #fff;
  color: #1a1d1a;
  font: inherit;
  box-sizing: border-box;
}

.field-control:focus { outline: 2px solid rgba(119, 135, 50, .3); border-color: #778732; }
.quantity-row { justify-content: space-between; margin-top: 2px; }
.quantity-control { display: flex; align-items: center; border: 1px solid #d9ded7; border-radius: 8px; overflow: hidden; }
.quantity-control button { width: 34px; height: 34px; border: none; background: #f7f8f6; color: #778732; display: grid; place-items: center; cursor: pointer; }
.quantity-control input { width: 48px; height: 34px; padding: 0; border: 0; text-align: center; font: inherit; }
.message-control { resize: vertical; min-height: 96px; }
.footer-actions { gap: 12px; margin-top: 10px; }
.btn-cancel,
.btn-submit { flex: 1; padding: 12px 16px; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer; }
.btn-cancel { border: 1px solid #d9ded7; background: #fff; color: #1a1d1a; }
.btn-submit { border: 1px solid #778732; background: #778732; color: #fff; }
.btn-submit:hover { background: #657329; }
</style>
