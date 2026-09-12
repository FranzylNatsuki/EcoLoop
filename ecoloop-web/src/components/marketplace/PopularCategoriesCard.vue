<script setup lang="ts">
interface CategorySummary {
  name: string
  count: number
  icon: string
}

const categories: CategorySummary[] = [
  { name: 'Wood & Timber', count: 42, icon: 'file-text' },
  { name: 'Glass Bottles & Jars', count: 28, icon: 'box' },
  { name: 'Metal Scraps & Wire', count: 35, icon: 'cpu' },
  { name: 'Upcycled Furniture', count: 19, icon: 'home' },
  { name: 'Tires & Rubber', count: 12, icon: 'settings' }
]
</script>

<template>
  <div class="sidebar-card">
    <h2 class="card-title">Popular Categories</h2>
    <div class="divider-line"></div>
    <div class="sidebar-content">
      <div v-for="cat in categories" :key="cat.name" class="category-row">
        <div class="row-left">
          <div class="icon-bg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
            </svg>
          </div>
          <span class="category-name">{{ cat.name }}</span>
        </div>
        <span class="listings-count">{{ cat.count }} listings</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-card {
  background: white;
  border: 1px solid #E4E7E3;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1A1D1A;
}

.divider-line {
  height: 1px;
  background-color: #E4E7E3;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-bg {
  width: 32px;
  height: 32px;
  background: rgba(119, 135, 50, 0.08);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1D1A;
}

.listings-count {
  font-size: 12px;
  color: #8F9A8F;
}
</style>
