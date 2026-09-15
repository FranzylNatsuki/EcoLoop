<script setup lang="ts">
import { ref } from 'vue'
import { usePosts } from '../../composables/usePosts'
import CreatePostModal from '../Modals/CreatePost.vue'

const showCreateModal = ref(false)
const { addPost } = usePosts()

function handlePostCreated(postData: { category: string; title: string; description: string; images: string[] }) {
  addPost(postData)
  showCreateModal.value = false
}
</script>
<template>
  <button type="button" class="btn-create-post" @click="showCreateModal = true">
    <span class="icon-wrapper">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.9162 7H11.0838M7 2.9162V11.0838" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="btn-text">Create Post</span>
  </button>

  <CreatePostModal
    v-model="showCreateModal"
    @created="handlePostCreated"
  />
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
  text-decoration: none;
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
