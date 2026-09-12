<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    to?: string
    label?: string
  }>(),
  {
    to: '/home',
    label: 'Back',
  }
)
</script>

<template>
  <RouterLink :to="to" class="back-btn">
    <ArrowLeft :size="16" />
    <span>{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(119, 135, 50, 0.3);
  border-radius: 8px;
  color: #617024;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  margin-bottom: 20px; /* Added spacing underneath */
}

.back-btn:hover {
  background: rgba(119, 135, 50, 0.1);
  border-color: #617024;
  color: #4f5b1d;
}

.back-btn:active {
  transform: translateY(1px);
}
</style>
