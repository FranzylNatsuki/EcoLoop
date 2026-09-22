<script setup lang="ts">
import type { Pledge } from '../../types/event'

defineProps<{
  donors?: Pledge[]
}>()
</script>

<template>
  <section class="event-side-card">
    <h2>Top Donors</h2>

    <div class="event-divider" />

    <div class="donor-list" v-if="donors && donors.length > 0">
      <div
        v-for="(donor, index) in donors"
        :key="donor.id || index"
        class="donor-row"
      >
        <div class="rank">
          {{ index + 1 }}
        </div>

        <img
          :src="donor.donor_avatar || 'https://placehold.co/36x36'"
          :alt="donor.donor"
          class="donor-avatar"
        />

        <div class="donor-info">
          <strong>{{ donor.donor }}</strong>
          <span>{{ donor.time }}</span>
        </div>

        <strong class="donor-amount">
          {{ donor.quantity }}
        </strong>
      </div>
    </div>

    <p v-else class="empty-state">No top contributors listed yet.</p>
  </section>
</template>

<style scoped>
.event-side-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.event-side-card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.event-divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 16px 0;
}

.donor-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.donor-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank {
  font-weight: 700;
  color: #94a3b8;
  font-size: 0.9rem;
  width: 16px;
}

.donor-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.donor-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.donor-info strong {
  font-size: 0.9rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.donor-info span {
  font-size: 0.75rem;
  color: #64748b;
}

.donor-amount {
  font-size: 0.85rem;
  font-weight: 700;
  color: #16a34a;
}

.empty-state {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}
</style>
