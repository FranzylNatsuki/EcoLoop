<script setup lang="ts">
import { computed } from 'vue'

export interface EventItem {
  type: 'event'
  id: number | string
  org_id?: string
  event_title: string
  schedule: string
  location: string
  description: string
  participant_goal: number | string
  images?: string[]
  category?: string
  attendees_count?: number
}

const props = defineProps<{
  event: EventItem
}>()

const emit = defineEmits<{
  (e: 'join', eventId: number | string): void
  (e: 'share', eventId: number | string): void
}>()

// Format raw ISO or date string to readable format
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

function handleJoin() {
  emit('join', props.event.id)
}

function handleShare() {
  emit('share', props.event.id)
}
</script>

<template>
  <article class="event-card">

    <!-- Top Header: Type Tag & Category -->
    <div class="card-header">
      <div class="badge-group">
        <!-- Distinct Event Badge -->
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

      <button type="button" class="share-btn" @click="handleShare" aria-label="Share event">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F9A8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>

    <!-- Event Title -->
    <h3 class="event-title">{{ event.event_title }}</h3>

    <!-- Key Metadata Strip (Date, Location, Goal) -->
    <div class="meta-details">
      <!-- Schedule -->
      <div class="meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{{ formattedSchedule }}</span>
      </div>

      <!-- Location -->
      <div v-if="event.location" class="meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="truncate">{{ event.location }}</span>
      </div>

      <!-- Participant Goal -->
      <div v-if="event.participant_goal" class="meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>
          <strong v-if="event.attendees_count !== undefined">{{ event.attendees_count }} / </strong>
          {{ event.participant_goal }} Goal
        </span>
      </div>
    </div>

    <!-- Description -->
    <p class="event-description">{{ event.description }}</p>

    <!-- Image Gallery Preview (Optional) -->
    <div v-if="event.images && event.images.length > 0" class="image-gallery">
      <div
        v-for="(img, idx) in event.images.slice(0, 3)"
        :key="idx"
        class="image-wrapper"
      >
        <img :src="img" :alt="`Event photo ${idx + 1}`" />
      </div>
    </div>

    <!-- Footer Action -->
    <div class="card-footer">
      <button type="button" class="join-btn" @click="handleJoin">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        <span>RSVP / Join Event</span>
      </button>
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
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 24px rgba(26, 29, 26, 0.08);
}

/* Header & Badges */
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

/* Distinct Event Badge */
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

/* Title & Content */
.event-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1d1a;
  line-height: 1.3;
}

/* Meta Details Grid */
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

/* Image Previews */
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.image-wrapper {
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Footer & Actions */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 4px;
}

.join-btn {
  width: 100%;
  padding: 12px 20px;
  background: #778732;
  border: none;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.join-btn:hover {
  background: #65732a;
}
</style>
