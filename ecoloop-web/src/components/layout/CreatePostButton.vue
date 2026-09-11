<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface Props {
  label?: string
  to?: string | object
}

withDefaults(defineProps<Props>(), {
  label: 'Create Post',
  to: '/'
})
</script>

<template>
  <RouterLink :to="to" class="btn-create-post">
    <span class="icon-wrapper">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.9162 7H11.0838M7 2.9162V11.0838" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="btn-text">
      <slot>{{ label }}</slot>
    </span>
  </RouterLink>
</template>

<style scoped>
.btn-create-post {
  padding: 10px 18px;
  background: #778732;
  border-radius: 20px;
  border: none;
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-decoration: none; /* Added to prevent link underline */
}

.btn-create-post:hover {
  background: #617024;
}

.icon-wrapper {
  width: 14px;
  height: 14px;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.btn-text {
  color: #ffffff;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  word-wrap: break-word;
}
</style>
