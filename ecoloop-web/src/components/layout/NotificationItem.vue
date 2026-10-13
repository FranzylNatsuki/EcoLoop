<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  pledge: any
}>()

const router = useRouter()

// Format the date (e.g., "Oct 12") for standard notifications
const formattedDate = computed(() => {
  const date = new Date(props.pledge.created_at)
  return date.toLocaleDateString()
})

// Calculate time remaining for event reminders
const timeLeft = computed(() => {
  if (props.pledge.pledgeType !== 'event_reminder') return ''
  const dateStr = props.pledge.event_date
  if (!dateStr) return 'Date TBD'

  const eventTime = new Date(dateStr).getTime()
  if (isNaN(eventTime)) return 'Date TBD'

  const now = Date.now()
  const diffMs = eventTime - now

  if (diffMs > 0) {
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (totalDays >= 2) {
      return `${totalDays} days left`
    } else if (totalDays === 1) {
      const remainingHours = totalHours % 24
      return remainingHours > 0 ? `1 day ${remainingHours}h left` : '1 day left'
    } else if (totalHours >= 1) {
      const remainingMinutes = totalMinutes % 60
      return remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m left` : `${totalHours} hrs left`
    } else if (totalMinutes >= 1) {
      return `${totalMinutes} mins left`
    } else {
      return 'Starting soon'
    }
  }

  // Event time has arrived or passed
  if (props.pledge.end_time) {
    const endTime = new Date(props.pledge.end_time).getTime()
    if (!isNaN(endTime) && endTime > now) {
      return 'Happening now'
    }
  } else if (Math.abs(diffMs) < 4 * 60 * 60 * 1000) {
    return 'Happening now'
  }

  return 'Event ended'
})

const timeLeftClass = computed(() => {
  const text = timeLeft.value.toLowerCase()
  if (text.includes('now') || text.includes('starting soon')) return 'status-now'
  if (text.includes('ended')) return 'status-ended'
  return 'status-upcoming'
})

const navigateToPledge = () => {
  if (props.pledge.pledgeType === 'event_reminder') {
    router.push(props.pledge.link || `/events/${props.pledge.eventId || props.pledge.id}`)
    return
  }
  if (props.pledge.pledgeType === 'db_notif') {
    if (props.pledge.link) router.push(props.pledge.link)
    return
  }
  if (props.pledge.pledgeType === 'event') {
    router.push({ path: `/pledge/${props.pledge.id}`, query: { type: 'event' } })
  } else if (props.pledge.pledgeType === 'marketplace') {
    router.push({ path: `/marketplace/${props.pledge.post_id}`, query: { request: 'true' } })
  } else {
    router.push(`/pledge/${props.pledge.id}`)
  }
}
</script>

<template>
  <div class="notification-item" :class="{ 'is-reminder': pledge.pledgeType === 'event_reminder' }" @click="navigateToPledge">
    <div class="icon-indicator">
      <template v-if="pledge.pledgeType === 'event_reminder'">
        <!-- Calendar / Event Reminder Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </template>
      <template v-else-if="pledge.pledgeType === 'db_notif'">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </template>
      <template v-else-if="pledge.pledgeType === 'marketplace'">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="21" r="1"/>
          <circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
      </template>
      <template v-else>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        </svg>
      </template>
    </div>
    <div class="notif-content">
      <template v-if="pledge.pledgeType === 'event_reminder'">
        <div class="reminder-header">
          <span class="reminder-badge">EVENT REMINDER</span>
          <span class="time-left-pill" :class="timeLeftClass">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {{ timeLeft }}
          </span>
        </div>
        <p class="reminder-title">{{ pledge.title }}</p>
        <span v-if="pledge.location" class="reminder-sub">📍 {{ pledge.location }}</span>
      </template>
      <template v-else>
        <p class="notif-text">
          <template v-if="pledge.pledgeType === 'db_notif'">
            <strong>{{ pledge.title }}</strong><br />
            {{ pledge.message }}
          </template>
          <template v-else-if="pledge.pledgeType === 'marketplace'">
            <strong>{{ pledge.buyer?.full_name || 'Someone' }}</strong>
            asked to buy your item
            <em>"{{ pledge.post?.title || 'Unknown Listing' }}"</em>
          </template>
          <template v-else>
            <strong>{{ pledge.donor?.full_name || 'Someone' }}</strong>
            pledged to your post
            <em>"{{ pledge.post?.title || 'Unknown Post' }}"</em>
          </template>
        </p>
        <span class="time-ago">{{ formattedDate }}</span>
      </template>
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
.notification-item.is-reminder {
  background: #fbfdf9;
  border-left: 3px solid #778732;
}
.notification-item.is-reminder:hover {
  background: #f3f7ec;
}
.icon-indicator {
  margin-right: 12px;
  margin-top: 2px;
  flex-shrink: 0;
}
.notif-content {
  flex: 1;
  min-width: 0;
}
.notif-text {
  margin: 0;
  font-size: 0.88rem;
  color: #333;
  line-height: 1.4;
}
.time-ago {
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
  display: block;
}
.reminder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.reminder-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #55631f;
  background: #e9f0d8;
  padding: 2px 6px;
  border-radius: 4px;
}
.time-left-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.time-left-pill.status-upcoming {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.time-left-pill.status-now {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.time-left-pill.status-ended {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}
.reminder-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reminder-sub {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
