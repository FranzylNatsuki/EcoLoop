<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EventItem } from '../../types/event'
import { useRouter } from 'vue-router'

const props = defineProps<{
  event: EventItem
}>()

const emit = defineEmits<{
  (e: 'join', eventId: number | string): void
  (e: 'share', eventId: number | string): void
}>()

const router = useRouter()
function goToEvent() {
  router.push(`/events/${props.event.id}`)
}

const defaultPlaceholder = 'https://placehold.co/600x360?text=No+Image+Available'

const formattedSchedule = computed(() => {
  if (!props.event.schedule) return 'Date TBD'
  const date = new Date(props.event.schedule)
  if (isNaN(date.getTime())) return props.event.schedule

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
})

const showShareToast = ref(false)
async function handleShare() {
  const url = `${window.location.origin}/events/${props.event.id}`
  try {
    await navigator.clipboard.writeText(url)
    showShareToast.value = true
    setTimeout(() => { showShareToast.value = false }, 2500)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = defaultPlaceholder
}
</script>

<template>
  <article class="event-card" @click="goToEvent">
    <div class="card-header">
      <div class="badge-group">
        <span class="event-type-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          EVENT
        </span>

        <span v-if="event.category" class="category-tag">
          {{ event.category }}
        </span>
      </div>
    </div>

    <h3 class="event-title">{{ event.event_title }}</h3>

    <div class="meta-details">
      <div class="meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{{ formattedSchedule }}</span>
      </div>

      <div v-if="event.location" class="meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="truncate">{{ event.location }}</span>
      </div>
    </div>

    <p class="event-description">{{ event.description }}</p>

    <!-- Main Banner Display -->
    <div class="image-gallery">
      <div class="image-wrapper">
        <img
          :src="event.image && event.image.trim() !== '' ? event.image : defaultPlaceholder"
          :alt="event.event_title"
          @error="handleImageError"
        />
      </div>
    </div>

    <div class="card-footer">
      <button type="button" class="share-action-btn" @click.stop="handleShare">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>

      <button type="button" class="join-btn" @click.stop="goToEvent">
        <span>Join Event</span>
      </button>
    </div>

    <!-- Share Toast -->
    <div v-if="showShareToast" class="share-toast">
      Link Copied to Clipboard
    </div>
  </article>
</template>

<style scoped>
.event-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0px 4px 16px rgba(26, 29, 26, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 24px rgba(26, 29, 26, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #778732;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 20px;
}

.category-tag {
  padding: 4px 10px;
  background: rgba(119, 135, 50, 0.1);
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
}

.share-btn {
  background: #f7f8f6;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.share-btn:hover {
  background: #e4e7e3;
}

.event-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1d1a;
  line-height: 1.3;
}

.meta-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  background: #f7f8f6;
  border-radius: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1a1d1a;
}

.truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-description {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #4a524a;
}

.image-gallery {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.image-wrapper {
  height: 360px;
  border-radius: 6px;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #f0f2ef;
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

.join-btn {
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

.join-btn:hover {
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
</style>
