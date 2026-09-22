<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Listing } from '../../types/marketplace'

const props = defineProps<{
  listing: Listing
}>()

const router = useRouter()

function openListing() {
  router.push({ name: 'MarketDetail', params: { id: props.listing.id } })
}

const getConditionStyle = (condition: string) => {
  switch (condition) {
    case 'Like New':
      return { bg: 'rgba(119, 135, 50, 0.12)', color: '#778732' }
    case 'Fair':
      return { bg: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }
    case 'Good':
      return { bg: 'rgba(134, 162, 177, 0.12)', color: '#86A2B1' }
    default:
      return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280' }
  }
}
</script>

<template>
  <div class="listing-card" role="link" tabindex="0" @click="openListing" @keydown.enter="openListing">
    <div class="image-container">
      <img :src="listing.image" :alt="listing.title" class="product-photo" />
      <div
        class="condition-badge"
        :style="{
          backgroundColor: getConditionStyle(listing.condition).bg,
          borderColor: getConditionStyle(listing.condition).color
        }"
      >
        <span :style="{ color: getConditionStyle(listing.condition).color }">
          {{ listing.condition }}
        </span>
      </div>
    </div>

    <div class="card-body">
      <div class="title-price-row">
        <h3 class="item-title" @click.stop="openListing">{{ listing.title }}</h3>
      </div>
      <div class="pricing-row">
        <span class="item-price" :class="{ 'text-accent': listing.price === 'Free' || listing.price === 'Trade' }">
          {{ listing.price }}
        </span>
        <span v-if="listing.isBarter" class="trade-pill">BARTER</span>
      </div>
      <div class="divider-line"></div>
      <div class="meta-row">
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="seller-name">{{ listing.seller }}</span>
        </div>
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span class="location">{{ listing.location }}</span>
        </div>
      </div>
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
  height: 190px;
  position: relative;
  width: 100%;
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

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.seller-name {
  color: #525A52;
}

.location {
  color: #8F9A8F;
}
</style>
