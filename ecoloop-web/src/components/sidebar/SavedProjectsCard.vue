<script setup lang="ts">
import { Bookmark } from 'lucide-vue-next'

interface SavedProject {
  id: string | number
  title: string
  savedDate: string
  thumbnail: string
}

defineProps<{
  projects?: SavedProject[]
}>()

const defaultProjects: SavedProject[] = [
  { id: 1, title: 'Glass Bottle Herb Planters', savedDate: 'Saved Oct 10, 2026', thumbnail: 'https://placehold.co/64x64' },
  { id: 2, title: 'Vertical Plastic Bottle Planter', savedDate: 'Saved Oct 05, 2026', thumbnail: 'https://placehold.co/64x64' }
]
</script>

<template>
  <div class="sidebar-card">
    <h2>Saved Projects</h2>
    <div class="divider"></div>
    <div class="project-list">
      <div
        v-for="project in (projects || defaultProjects)"
        :key="project.id"
        class="saved-project-item"
      >
        <img :src="project.thumbnail" :alt="project.title" class="project-thumb" />
        <div class="project-details">
          <span class="project-title">{{ project.title }}</span>
          <span class="saved-date">{{ project.savedDate }}</span>
        </div>
        <button class="bookmark-btn" aria-label="Unsave project">
          <Bookmark class="icon" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-card {
  background: white;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  padding: 20px;
}

.sidebar-card h2 {
  margin: 0 0 14px;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: #1a1d1a;
}

.divider {
  height: 1px;
  background: #e4e7e3;
  margin-bottom: 16px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.saved-project-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.project-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.project-title {
  color: #1a1d1a;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  line-height: 1.3;
}

.saved-date {
  color: #8f9a8f;
  font-size: 11px;
  font-family: 'Geist', sans-serif;
}

.bookmark-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  color: var(--color-brand, #778732);
  fill: var(--color-brand, #778732);
}
</style>
