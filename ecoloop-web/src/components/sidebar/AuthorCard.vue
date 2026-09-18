<script setup lang="ts">
import { RouterLink } from 'vue-router'

export interface AuthorProfile {
  id: string
  name: string
  avatar: string
  bio?: string
  postCount?: number
  communityScore?: number
  joinedYear?: string
}

defineProps<{ author: AuthorProfile }>()
</script>

<template>
  <section class="sidebar-card">
    <h2>Post Author</h2>

    <RouterLink :to="`/user/${author.id}`" class="profile-link" style="text-decoration: none;">
        <div class="author-profile">
        <img :src="author.avatar" :alt="author.name" class="avatar" />
        <div>
            <strong>{{ author.name }}</strong>
        </div>
        </div>

        <!-- Bio -->
        <p v-if="author.bio" class="author-bio">{{ author.bio }}</p>
        <p v-else class="author-bio empty-bio">No bio available.</p>
    </RouterLink>

    <!-- Stats Grid: Posts & Community Score -->
    <div class="author-stats">
        <div class="stat-box">
            <strong>{{ author.postCount || 0 }}</strong>
            <span>Posts</span>
        </div>
        <div class="stat-box score-box">
            <strong>{{ author.communityScore?.toFixed(1) || '0.0' }}</strong>
            <span>Comm. Score</span>
        </div>
    </div>
    <!-- Join Year -->
    <div v-if="author.joinedYear" class="joined-date">
      Joined {{ author.joinedYear }}
    </div>
  </section>
</template>

<style scoped>
.sidebar-card { background: #ffffff; border: 1px solid #e4e7e3; border-radius: 12px; padding: 20px; }
.sidebar-card h2 { margin: 0 0 14px; font-family: 'Outfit', sans-serif; font-size: 16px; color: #1a1d1a; }
.author-profile { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.author-profile strong { color: #1a1d1a; font-size: 15px; }

.author-bio { margin: 0 0 16px; font-size: 13px; color: #525a52; line-height: 1.5; }
.empty-bio { color: #8f9a8f; font-style: italic; }

/* Adjusted for 2 columns */
.author-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.stat-box { padding: 12px; background: #f7f8f6; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-box strong { font-family: 'Outfit', sans-serif; font-size: 18px; color: #1a1d1a; }
.stat-box span { font-size: 11px; color: #8f9a8f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center; }

/* Highlight the community score slightly */
.score-box { background: rgba(119, 135, 50, 0.08); }
.score-box strong { color: #778732; }

.joined-date { color: #8f9a8f; font-size: 12px; text-align: center; padding-top: 12px; border-top: 1px solid #e4e7e3; }
</style>
