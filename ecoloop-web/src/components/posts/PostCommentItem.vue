<script setup lang="ts">
import { RouterLink } from 'vue-router'

export interface Comment {
  id: string | number
  author: string
  authorId: string
  avatarInitial: string
  avatarUrl?: string // Added this line
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
        <RouterLink :to="`/profile/${comment.authorId}`">
            <img v-if="comment.avatarUrl" :src="comment.avatarUrl" :alt="comment.author" class="avatar-img" />
             <span v-else>{{ comment.avatarInitial }}</span>
        </RouterLink>
    </div>

    <div class="comment-content">
      <div class="comment-meta">
          <RouterLink :to="`/user/${comment.authorId}`" class="comment-author-link">
                    <strong>{{ comment.author }}</strong>
          </RouterLink>
        <span>•</span>
        <span>{{ comment.timeAgo }}</span>
      </div>
      <p>{{ comment.content }}</p>
      <!-- <button class="reply-button" @click="emit('reply', comment.id)">Reply</button> -->

      <template v-if="comment.replies?.length">
        <PostCommentItem v-for="reply in comment.replies" :key="reply.id" :comment="reply" @reply="(id) => emit('reply', id)" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.comment { display: flex; gap: 12px; padding: 18px 0; border-top: 1px solid #e4e7e3; }
.comment-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: #e8eee4; color: #778732; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; overflow: hidden; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.comment-content { flex: 1; min-width: 0; }
.comment-meta { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; font-size: 12px; color: #8f9a8f; }
.comment-meta strong { color: #1a1d1a; }
.comment-content p { margin: 0 0 8px; color: #525a52; font-size: 13px; line-height: 1.55; }
.reply-button { border: none; background: transparent; padding: 0; color: #778732; font-size: 12px; font-weight: 600; cursor: pointer; }
.nested-comment { margin-top: 14px; padding-top: 14px; padding-bottom: 0; padding-left: 16px; border-left: 2px solid #e4e7e3; border-top: none; }
.author-comment-avatar { background: rgba(119, 135, 50, 0.1); }
</style>

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
.comment-author-link { text-decoration: none; color: inherit; }
.comment-author-link:hover strong { text-decoration: underline; color: #778732; }

</style>
