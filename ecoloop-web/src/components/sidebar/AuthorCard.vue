<script setup lang="ts">
export interface AuthorProfile {
  name: string
  avatar: string
  // Core optional metadata
  handle?: string
  bio?: string
  karma?: number
  tipsShared?: number
  upcycles?: number
  joinedDate?: string
  joinedYear?: string
  rankingCategory?: string
  rankingPosition?: string
  location?: string
  isFollowing?: boolean
}
defineProps<{ author: AuthorProfile }>()
</script>

<template>
  <section class="sidebar-card">
    <h2>Post Author</h2>
    <div class="author-profile">
      <img :src="author.avatar" :alt="author.name" class="avatar" />
      <div>
        <strong>u/{{ author.name }}</strong>
      </div>
    </div>

    <p>{{ author.bio }}</p>

    <div class="author-stats">
      <div><strong>{{ author.tipsShared }}</strong><span>Tips Shared</span></div>
      <div><strong>{{ author.upcycles }}</strong><span>Upcycles</span></div>
    </div>

    <div class="author-ranking">
      <strong>{{ author.rankingPosition }}</strong>
      <span>In {{ author.rankingCategory }}</span>
    </div>
    <div class="joined-date">Joined {{ author.joinedYear }}</div>
  </section>
</template>

<style scoped>
.sidebar-card { background: #ffffff; border: 1px solid #e4e7e3; border-radius: 12px; padding: 20px; }
.sidebar-card h2 { margin: 0 0 14px; font-family: 'Outfit', sans-serif; font-size: 16px; color: #1a1d1a; }
.author-profile { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.author-profile > div { display: flex; flex-direction: column; gap: 3px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.sidebar-card p { margin: 0 0 16px; font-size: 13px; color: #525a52; }
.author-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.author-stats div { padding: 10px; background: #f7f8f6; border-radius: 8px; display: flex; flex-direction: column; gap: 2px; }
.author-stats strong { font-family: 'Outfit', sans-serif; font-size: 15px; color: #1a1d1a; }
.author-stats span { font-size: 11px; color: #8f9a8f; }
.author-ranking { display: flex; align-items: center; gap: 6px; padding: 10px; background: rgba(119, 135, 50, 0.08); border-radius: 8px; color: #778732; font-size: 12px; }
.joined-date { margin-top: 12px; color: #8f9a8f; font-size: 11px; }
</style>
