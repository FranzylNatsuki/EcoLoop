<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router' // 1. Import router

const props = defineProps<{
  pledge: any
}>()

const router = useRouter() // 2. Initialize router

// 3. Create the navigation function
const goToDetails = () => {
  if (props.pledge?.id) {
    router.push(`/pledge/${props.pledge.id}`)
  }
}

const formattedDate = computed(() => {
  return new Date(props.pledge.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const itemSummary = computed(() => {
  const items = props.pledge.items || []
  if (items.length === 0) return 'Various materials'

  const firstItem = `${items[0].quantity} ${items[0].unit} ${items[0].material_name}`
  if (items.length === 1) return firstItem
  return `${firstItem} + ${items.length - 1} more`
})
</script>

<template>
  <!-- 4. Add the click handler to the root div -->
  <div class="donation-card" @click="goToDetails">
    <div class="card-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#778732" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    </div>

    <div class="card-content">
      <div class="card-header">
        <h4 class="project-title">Supported: {{ pledge.post?.title || 'Unknown Project' }}</h4>
        <span class="status-badge" :class="pledge.status">{{ pledge.status }}</span>
      </div>

      <p class="pledge-title">"{{ pledge.title }}"</p>

      <div class="card-footer">
        <span class="item-summary">{{ itemSummary }}</span>
        <span class="date">{{ formattedDate }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donation-card {
  display: flex;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer; /* 5. Add cursor pointer so users know it's clickable */
}
.donation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.card-icon {
  width: 48px;
  height: 48px;
  background: #f4f5f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.project-title {
  margin: 0;
  font-size: 0.95rem;
  color: #8F9A8F;
  font-weight: 500;
}
.status-badge {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.pledge-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1A1D1A;
  font-weight: 600;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
}
.item-summary {
  font-weight: 500;
  color: #525A52;
}
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.active { background: #d4edda; color: #155724; }
.status-badge.completed { background: #cce5ff; color: #004085; }
.status-badge.rejected { background: #f8d7da; color: #721c24; }
</style>
