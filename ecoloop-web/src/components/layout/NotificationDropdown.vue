<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../composables/useAuth'
import NotificationItem from './NotificationItem.vue'

const notifications = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  // Query pledges where the related post's author is the current user
  // We use !inner to filter the parent table based on the joined table
  const { data, error } = await supabase
    .from('pledges')
    .select(`
      id,
      created_at,
      status,
      donor:profiles!pledges_donor_id_fkey(full_name),
      post:cause_requests!inner(title, author_id)
    `)
    .eq('cause_requests.author_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching notifications:', error.message)
  } else {
    notifications.value = data || []
  }

  isLoading.value = false
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
