<script setup lang="ts">
import { onMounted } from 'vue'
import NotificationItem from './NotificationItem.vue'
import { useNotifications } from '../../composables/useNotifications'

const { notifications, isLoading, fetchNotifications, markAsRead } = useNotifications()

onMounted(async () => {
  await fetchNotifications()
  markAsRead()
})
</script>

<template>
  <div class="notification-dropdown">
    <div class="dropdown-header">
      <h4>Notifications</h4>
    </div>

    <div v-if="isLoading" class="loading-state">Loading...</div>
    <div v-else-if="notifications.length === 0" class="empty-state">
      No new pledges yet.
    </div>

    <div v-else class="notifications-list">
      <!-- Pass the data down to the individual item component -->
      <NotificationItem
        v-for="notif in notifications"
        :key="notif.id"
        :pledge="notif"
      />
    </div>
  </div>
</template>

<style scoped>
/* Add your dropdown positioning and styling here */
.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 400px;
  overflow-y: auto;
}
.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.empty-state {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>
