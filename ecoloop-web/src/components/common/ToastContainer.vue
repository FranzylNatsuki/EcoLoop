<script setup lang="ts">
import { useToast } from '../../composables/useToast'
const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast-message" :class="toast.type">
        {{ toast.message }}
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 10000; pointer-events: none; }
.toast-message { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 250px; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); pointer-events: auto; }
.toast-message.success { background: #778732; }
.toast-message.error { background: #dc2626; }
.toast-message.info { background: #3b82f6; }
.toast-close { background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.8; }
.toast-close:hover { opacity: 1; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>
