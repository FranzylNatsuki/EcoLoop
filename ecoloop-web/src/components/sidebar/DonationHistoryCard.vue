<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'

interface DonationItem {
  id: string | number
  title: string
  date: string
  status: string
}

defineProps<{
  donations?: DonationItem[]
}>()

// Default fallback data matching your Figma design
const defaultDonations: DonationItem[] = [
  { id: 1, title: '5 glass bottles to Community Garden Pavilion', date: 'Oct 12, 2026', status: 'Delivered' },
  { id: 2, title: '12 wood planks to Pallet Bench Project', date: 'Oct 08, 2026', status: 'Delivered' },
  { id: 3, title: '3 old laptops to Tech Restoration Lab', date: 'Sep 28, 2026', status: 'Delivered' }
]
</script>

<template>
  <div class="sidebar-card">
    <h2>Donation History</h2>
    <div class="divider"></div>
    <div class="donation-list">
      <div
        v-for="item in (donations || defaultDonations)"
        :key="item.id"
        class="donation-item"
      >
        <div class="donation-info">
          <MapPin class="icon" :size="16" />
          <div class="donation-details">
            <span class="donation-title">{{ item.title }}</span>
            <span class="donation-date">{{ item.date }}</span>
          </div>
        </div>
        <span class="badge">{{ item.status }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-card {
  background: white;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  padding: 20px;
}

.sidebar-card h2 {
  margin: 0 0 14px;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: #1a1d1a;
}

.divider {
  height: 1px;
  background: #e4e7e3;
  margin-bottom: 16px;
}

.donation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.donation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.donation-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  color: var(--color-brand, #778732);
  flex-shrink: 0;
}

.donation-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.donation-title {
  color: #1a1d1a;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  line-height: 1.2;
}

.donation-date {
  color: #8f9a8f;
  font-size: 11px;
  font-family: 'Geist', sans-serif;
}

.badge {
  padding: 4px 8px;
  background: rgba(119, 135, 50, 0.1);
  border-radius: 4px;
  color: var(--color-brand, #778732);
  font-size: 12px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  white-space: nowrap;
}
</style>
