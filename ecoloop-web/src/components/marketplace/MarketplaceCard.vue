<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../composables/useAuth'
import type { MarketplaceListing } from '../../composables/useMarketplace'
import { BadgeCheck } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  listing?: MarketplaceListing
  post?: MarketplaceListing
  variant?: 'grid' | 'feed'
}>(), { listing: undefined, post: undefined, variant: 'grid' })

const emit = defineEmits<{
  (event: 'edit', listing: MarketplaceListing | undefined): void
  (event: 'request-buy', listing: MarketplaceListing | undefined): void
}>()

const listingData = computed(() => props.post || props.listing)

const router = useRouter()
const currentUser = ref<{ id: string } | null>(null)

const isOwner = computed(() => {
  const ownerId = listingData.value?.author_id
  return Boolean(currentUser.value?.id && ownerId && currentUser.value.id === ownerId)
})

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser.value = session?.user ? { id: session.user.id } : null
})

function openListing() {
  if (!listingData.value?.id) return
  router.push({ name: 'MarketDetail', params: { id: listingData.value.id } })
}

function handleListingAction(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (isOwner.value) emit('edit', listingData.value)
  else emit('request-buy', listingData.value)
}

const showShareToast = ref(false)
async function handleShare() {
  const url = `${window.location.origin}/marketplace/${listingData.value?.id || ''}`
  try {
    await navigator.clipboard.writeText(url)
    showShareToast.value = true
    setTimeout(() => { showShareToast.value = false }, 2500)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const coverImage = computed(() =>
  listingData.value?.images?.[0]?.image_url || 'https://placehold.co/400x300'
)

const sellerName = computed(() => listingData.value?.author?.full_name || 'Anonymous User')

const formattedPrice = computed(() => {
  const l = listingData.value
  if (!l) return ''
  if (l.pricing_type === 'Free/Donation') return 'Free'
  return l.price != null ? `₱${l.price.toLocaleString()}` : '—'
})

const isFree = computed(() => listingData.value?.pricing_type === 'Free/Donation')

const getCategoryStyle = (category?: string) => {
  switch (category) {
    case 'Electronics': return { bg: 'rgba(134, 162, 177, 0.12)', color: '#86A2B1' }
    case 'Metal':       return { bg: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }
    case 'Glass':       return { bg: 'rgba(119, 135, 50, 0.12)', color: '#778732' }
    default:            return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280' }
  }
}
</script>

<template>
  <div :class="['listing-card', `variant-${variant}`]" role="link" tabindex="0" @click="openListing" @keydown.enter="openListing">
    <!-- Header for feed variant -->
    <div v-if="variant === 'feed'" class="feed-header">
      <div class="feed-seller-meta">
        <img :src="listingData?.author?.Avatar || 'https://placehold.co/38x38'" :alt="sellerName" class="seller-avatar-feed" />
        <span class="seller-name-feed">{{ sellerName }}</span>
        <BadgeCheck
          v-if="listingData?.author?.is_org && listingData?.author?.is_verified"
          fill="#3B82F6"
          color="white"
          :size="15"
          class="verified-badge"
        />
        <span class="meta-dot">•</span>
        <span class="listing-time">{{ listingData?.created_at ? new Date(listingData.created_at).toLocaleDateString() : 'Marketplace' }}</span>
      </div>
      <span class="marketplace-type-badge">MARKETPLACE</span>
    </div>

    <div class="image-container">
      <img :src="coverImage" :alt="listingData?.title" class="product-photo" />
      <div
        class="condition-badge"
        :style="{
          backgroundColor: getCategoryStyle(listingData?.category).bg,
          borderColor: getCategoryStyle(listingData?.category).color
        }"
      >
        <span :style="{ color: getCategoryStyle(listingData?.category).color }">
          {{ listingData?.category }}
        </span>
      </div>
    </div>

    <div class="card-body">
      <div class="title-price-row">
        <h3 class="item-title" @click.stop="openListing">{{ listingData?.title }}</h3>
      </div>
      <div class="pricing-row">
        <span class="item-price" :class="{ 'text-accent': isFree }">
          {{ formattedPrice }}
        </span>
      </div>
      <div class="divider-line"></div>
      <div class="meta-row">
        <div class="meta-item">
          <img v-if="listingData?.author?.Avatar" :src="listingData.author.Avatar" :alt="sellerName" class="seller-avatar" />
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="seller-name">{{ sellerName }}</span>
          <BadgeCheck
            v-if="listingData?.author?.is_org && listingData?.author?.is_verified"
            fill="#3B82F6"
            color="white"
            :size="15"
            class="verified-badge"
          />
        </div>
      </div>

      <div class="card-footer-actions">
        <button type="button" class="share-action-btn" @click.stop="handleShare">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Share</span>
        </button>

        <button
          type="button"
          class="listing-action"
          @click="handleListingAction"
        >
          {{ isOwner ? 'Manage Listing' : 'Request to Buy' }}
        </button>
      </div>
    </div>

    <!-- Share Toast -->
    <div v-if="showShareToast" class="share-toast">
      Link Copied to Clipboard
    </div>
  </div>
</template>

<style scoped>
.listing-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-container {
  aspect-ratio: 1 / 1;
  position: relative;
  width: 100%;
}

.variant-feed .image-container {
  aspect-ratio: unset;
  max-height: 360px;
}

.variant-feed .product-photo {
  max-height: 360px;
}

.product-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.condition-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1D1A;
}

.pricing-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: #1A1D1A;
}

.item-price.text-accent {
  color: #778732;
}

.trade-pill {
  padding: 2px 6px;
  background: rgba(134, 162, 177, 0.12);
  color: #86A2B1;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.divider-line {
  height: 1px;
  background-color: #E4E7E3;
  width: 100%;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feed-header {
  padding: 16px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #E4E7E3;
}

.feed-seller-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  color: #525a52;
}

.seller-avatar-feed {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.seller-name-feed {
  font-weight: 600;
  color: #1a1d1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-dot {
  color: #8f9a8f;
}

.listing-time {
  color: #8f9a8f;
  font-size: 12px;
}

.marketplace-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #778732;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 20px;
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.seller-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.verified-badge {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.seller-name {
  color: #525A52;
  font-weight: 500;
}

.location {
  color: #8F9A8F;
}

.card-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #E4E7E3;
}

.share-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f7f8f6;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-action-btn:hover {
  background: #e4e7e3;
  color: #1a1d1a;
}

.listing-action {
  height: 32px;
  padding: 0 50px;
  background: #617024;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.listing-action:hover {
  background: #4f5b1d;
}

.share-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1d1a;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeInOut 2.5s ease-in-out forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  85% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -20px); }
}


.listing-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  cursor: pointer; /* <--- ADD THIS LINE */
  transition: transform 0.2s ease, box-shadow 0.2s ease; /* Optional: adds a nice hover effect */
}

/* Optional: Make it lift up slightly when hovered */
.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);
}

</style>
