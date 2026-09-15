<script setup lang="ts">
import { ref } from 'vue'
import PostCommentItem, { type Comment } from './PostCommentItem.vue'

defineProps<{ comments: Comment[] }>()
const emit = defineEmits<{
  (e: 'submit-comment', text: string): void
  (e: 'reply-comment', id: string | number): void
}>()

const commentText = ref('')
function handleSubmit() {
  if (!commentText.value.trim()) return
  emit('submit-comment', commentText.value)
  commentText.value = ''
}
</script>

<template>
  <section class="detail-card">
    <div class="section-header">
      <h2>Comments</h2>
      <p>Share your thoughts or experience.</p>
    </div>

    <div class="comment-input-area">
      <textarea v-model="commentText" placeholder="Write a helpful comment..."></textarea>
      <div class="comment-input-footer">
        <button class="comment-button" @click="handleSubmit">Comment</button>
      </div>
    </div>

    <PostCommentItem v-for="c in comments" :key="c.id" :comment="c" @reply="(id) => emit('reply-comment', id)" />
  </section>
</template>

<style scoped>
.detail-card { background: #ffffff; border: 1px solid #e4e7e3; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.section-header h2 { margin: 0 0 4px; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 600; color: #1a1d1a; }
.section-header p { margin: 0 0 18px; color: #8f9a8f; font-size: 13px; }
.comment-input-area { border: 1px solid #d9dde1; border-radius: 9px; overflow: hidden; margin-bottom: 20px; }
.comment-input-area textarea { width: 100%; min-height: 80px; padding: 12px; border: none; outline: none; resize: vertical; font-family: inherit; font-size: 13px; }
.comment-input-footer { display: flex; justify-content: flex-end; padding: 8px; background: #fafafa; border-top: 1px solid #e4e7e3; }
.comment-button { border: none; background: #778732; color: white; border-radius: 7px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; }
</style>
