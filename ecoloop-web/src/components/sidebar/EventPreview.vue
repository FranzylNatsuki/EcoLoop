<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Calendar } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    image?: string
    date?: string
    title?: string
    description?: string
    location?: string
    category?: string
    fundedPercentage?: number
  }>(),
  {
    image: '',
    date: 'TBD',
    title: 'Untitled Event',
    description: '',
    location: 'Unknown Location',
    category: 'Event',
    fundedPercentage: 0
  }
)

const defaultPlaceholder = 'https://placehold.co/400x250?text=Event'
// Computed property to format raw ISO/TIMESTAMPTZ dates cleanly
const formattedDate = computed(() => {
  if (!props.date || props.date === 'TBD') return 'TBD'
  const parsedDate = new Date(props.date)
  if (isNaN(parsedDate.getTime())) return props.date

  // Compact format ideal for small card badges
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsedDate)
})

const imageSource = computed(() => {
  if (!props.image || props.image.trim() === '') {
    return defaultPlaceholder
  }
  return props.image
})

// Fallback for broken or missing images
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = defaultPlaceholder
}
</script>

<template>
  <div class="sidebar-card event-card">
    <!-- Banner Image Container -->
    <div class="banner-wrapper">
      <img
        class="event-banner"
        :src="imageSource"
        :alt="title"
        @error="handleImageError"
      />
      <div v-if="category" class="category-badge">
        {{ category }}
      </div>
      <div v-if="date" class="date-badge">
        <Calendar :size="12" />
        <span>{{ formattedDate }}</span>
      </div>
    </div>

    <!-- Content Body -->
    <div class="event-content">
      <span class="section-label">Upcoming Event</span>
      <h3 class="event-title" :title="title">{{ title }}</h3>
      <p v-if="description" class="event-description">{{ description }}</p>

      <!-- Funding Progress Bar -->
      <div class="funding-section">
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: `${Math.min(100, Math.max(0, fundedPercentage))}%` }"
          ></div>
        </div>
        <span class="funded-label">{{ fundedPercentage }}% Funded</span>
      </div>

      <!-- Footer Row -->
      <div class="event-footer">
        <div class="event-meta">
          <MapPin :size="14" class="pin-icon" />
          <span class="location-text" :title="location">{{ location }}</span>
        </div>
        <button class="join-btn">View Event</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.event-card:hover {
  border-color: #cbd2c8;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.banner-wrapper {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #f7f8f6;
  flex-shrink: 0;
}

.event-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.category-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(26, 29, 26, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(26, 29, 26, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.event-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.section-label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #778732;
  margin-bottom: 6px;
}

.event-title {
  margin: 0 0 6px 0;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: #1a1d1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.45;
  color: #525a52;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.funding-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  width: 100%;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background-color: #e4e7e3;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #778732;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.funded-label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #8f9a8f;
}

.event-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f2ef;
  gap: 12px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.pin-icon {
  color: #86a2b1;
  flex-shrink: 0;
}

.location-text {
  font-size: 12px;
  font-weight: 500;
  color: #8f9a8f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.join-btn {
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 8px;
  padding: 6px 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1a1d1a;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.join-btn:hover {
  background: #778732;
  color: #ffffff;
  border-color: #778732;
}
</style>
