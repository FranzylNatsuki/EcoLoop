<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    image?: string
    title?: string
    category?: string
    fundedPercentage?: number
  }>(),
  {
    image: '',
    title: 'Untitled Event',
    category: '',
    fundedPercentage: 0
  }
)

const defaultPlaceholder =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="142" height="96" viewBox="0 0 142 96"><rect width="100%" height="100%" fill="%23F7F8F6"/><rect width="100%" height="100%" fill="none" stroke="%23E4E7E3" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238F9A8F" font-family="-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif" font-size="12" font-weight="500">142 × 96</text></svg>'

const imageSource = computed(() => {
  if (!props.image || props.image.trim() === '') {
    return defaultPlaceholder
  }
  return props.image
})

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = defaultPlaceholder
}
</script>

<template>
  <div class="related-event-row">
    <div class="thumb-container">
      <img
        :src="imageSource"
        :alt="title"
        class="thumb-img"
        @error="handleImageError"
      />
      <span v-if="category" class="category-pill" :title="category">
        {{ category }}
      </span>
    </div>

    <div class="info-container">
      <h4 class="event-title" :title="title">{{ title }}</h4>

      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :style="{ width: `${Math.min(100, Math.max(0, fundedPercentage))}%` }"
        ></div>
      </div>

      <span class="funded-label">{{ fundedPercentage }}% Funded</span>
    </div>
  </div>
</template>

<style scoped>
.related-event-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 4px 0;
  box-sizing: border-box;
}

.thumb-container {
  position: relative;
  width: 72px;
  height: 52px;
  min-width: 72px;
  min-height: 52px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f7f8f6;
  border: 1px solid #e4e7e3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.category-pill {
  position: absolute;
  top: 4px;
  left: 4px;
  max-width: calc(100% - 8px);
  padding: 2px 5px;
  background: rgba(26, 29, 26, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.info-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #1a1d1a;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-bar-track {
  width: 100%;
  height: 5px;
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
</style>
