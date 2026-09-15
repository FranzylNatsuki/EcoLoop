<script setup lang="ts">
export interface Comment {
  id: string | number
  author: string
  avatarInitial: string
  isAuthor?: boolean
  timeAgo: string
  content: string
  replies?: Comment[]
}

defineProps<{ comment: Comment }>()
const emit = defineEmits<{(e: 'reply', id: string | number): void}>()
</script>

<template>
  <div class="comment" :class="{ 'nested-comment': comment.isAuthor }">
    <div class="comment-avatar" :class="{ 'author-comment-avatar': comment.isAuthor }">
      {{ comment.avatarInitial }}
    </div>

    <div class="comment-content">
      <div class="comment-meta">
        <strong>{{ comment.author }}</strong>
        <span>•</span>
        <span>{{ comment.timeAgo }}</span>
      </div>
      <p>{{ comment.content }}</p>
      <button class="reply-button" @click="emit('reply', comment.id)">Reply</button>

      <template v-if="comment.replies?.length">
        <PostCommentItem v-for="reply in comment.replies" :key="reply.id" :comment="reply" @reply="(id) => emit('reply', id)" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.comment { display: flex; gap: 12px; padding: 18px 0; border-top: 1px solid #e4e7e3; }
.comment-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: #e8eee4; color: #778732; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
.comment-content { flex: 1; min-width: 0; }
.comment-meta { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; font-size: 12px; color: #8f9a8f; }
.comment-meta strong { color: #1a1d1a; }
.comment-content p { margin: 0 0 8px; color: #525a52; font-size: 13px; line-height: 1.55; }
.reply-button { border: none; background: transparent; padding: 0; color: #778732; font-size: 12px; font-weight: 600; cursor: pointer; }
.nested-comment { margin-top: 14px; padding-top: 14px; padding-bottom: 0; padding-left: 16px; border-left: 2px solid #e4e7e3; border-top: none; }
.author-comment-avatar { background: rgba(119, 135, 50, 0.1); }
</style>
