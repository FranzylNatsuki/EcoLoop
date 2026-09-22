<script setup lang="ts">
import type { Pledge } from '../../types/event'

defineProps<{
  pledges?: Pledge[]
}>()
</script>

<template>
  <section class="event-card">
    <div class="card-heading">
      <h2>Recent Donations</h2>
      <button class="view-all-btn">View All</button>
    </div>

    <div class="event-divider" />

    <div class="donations-list" v-if="pledges && pledges.length > 0">
      <div
        v-for="donation in pledges"
        :key="donation.id"
        class="donation"
      >
        <img
          :src="donation.donor_avatar || 'https://placehold.co/40x40'"
          :alt="donation.donor"
          class="donor-avatar"
        />

        <div class="donation-content">
          <div class="donation-header">
            <div class="donor-details">
              <strong>{{ donation.donor }}</strong>
              <span class="donated-quantity">{{ donation.quantity }}</span>
            </div>
            <small class="donation-time">{{ donation.time }}</small>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="empty-state">No recent donations yet. Be the first to donate!</p>
  </section>
</template>

<style scoped>
.event-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-heading h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.view-all-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.view-all-btn:hover {
  background: #f8fafc;
}

.event-divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 16px 0;
}

.donations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.donation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.donor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.donation-content {
  flex: 1;
}

.donation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.donor-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.donor-details strong {
  font-size: 0.95rem;
  color: #0f172a;
}

.donated-quantity {
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: 600;
}

.donation-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.empty-state {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}
</style>
