<script setup lang="ts">

import { useRouter } from 'vue-router'
import { MessageCircle, Share2, Bookmark, ShoppingBag } from 'lucide-vue-next'

const props = defineProps<{
  comments: number
  postId?: string | number
  hideComments?: boolean
  projectName?: string
  authorUsername?: string
}>()

const emit = defineEmits<{
  (e: 'requestBuy'): void
  (e: 'share'): void
  (e: 'save'): void
}>()

const router = useRouter()

function openPost() {
  if (props.postId) {
    router.push(`/post/${props.postId}`)
  }
}
</script>

<template>
  <div class="post-footer">
    <div class="actions-left">
      <button v-if="!hideComments" class="footer-action" @click="openPost">
        <MessageCircle :size="14" />
        <span>{{ comments }} Comments</span>
      </button>

      <button class="footer-action" @click="emit('share')">
        <Share2 :size="14" />
        <span>Share</span>
      </button>

      <button class="footer-action" @click="emit('save')">
        <Bookmark :size="14" />
        <span>Save</span>
      </button>
    </div>

    <button class="btn-donate btn-marketplace" @click.stop="emit('requestBuy')">
      <ShoppingBag :size="15" />
      <span>Request to Buy</span>
    </button>
  </div>
</template>

<style scoped>
/* ==========================================================================
   POST FOOTER CONTAINER
   ========================================================================== */
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #f0f2ef;
  gap: 12px;
  box-sizing: border-box;
}

/* ==========================================================================
   LEFT ACTIONS GROUP
   ========================================================================== */
.actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-action {
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
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.footer-action:hover {
  background: #e4e7e3;
  color: #1a1d1a;
}

/* ==========================================================================
   DONATE BUTTON
   ========================================================================== */
.btn-donate {
  height: 32px;
  padding: 0 50px;
  background: #617024;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.btn-donate:hover {
  background: #4f5b1d;
}

.btn-marketplace {
  gap: 7px;
  padding: 0 24px;
}
</style>
