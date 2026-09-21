<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  pledge: any
}>()

const router = useRouter()

// Format the date (e.g., "2 hours ago" or "Oct 12")
const formattedDate = computed(() => {
  const date = new Date(props.pledge.created_at)
  return date.toLocaleDateString() // You can swap this for date-fns formatDistanceToNow
})

const navigateToPledge = () => {
  // Pushes to the pledge view page, passing the ID in the URL
  router.push(`/pledge/${props.pledge.id}`)
}
</script>

<template>
  <div class="notification-item" @click="navigateToPledge">
    <div class="icon-indicator">
      <!-- Generic gift or leaf icon for donations -->
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      </svg>
    </div>
    <div class="notif-content">
      <p class="notif-text">
        <strong>{{ pledge.donor?.full_name || 'Someone' }}</strong>
        pledged to your post
        <em>"{{ pledge.post?.title }}"</em>
      </p>
      <span class="time-ago">{{ formattedDate }}</span>
    </div>
  </div>
</template>

<style scoped>
.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:hover {
  background: #f9fafb;
}
.icon-indicator {
  margin-right: 12px;
  margin-top: 2px;
}
.notif-text {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
}
.time-ago {
  font-size: 0.75rem;
  color: #888;
}
</style>
