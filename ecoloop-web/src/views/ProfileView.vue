<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PostCard from '../components/posts/PostCard.vue'
import DonationHistoryCard from '../components/sidebar/DonationHistoryCard.vue'
import SavedProjectsCard from '../components/sidebar/SavedProjectsCard.vue'
import { usePosts } from '../composables/usePosts'

const activeTab = ref('posts')

// Extract posts state and fetch method from composable
const { posts, fetchPosts } = usePosts()

// Fetch posts on view mount
onMounted(() => {
  fetchPosts()
})

// Current user profile configuration
const currentUser = ref({
  name: 'FranzyllTheory',
  handle: 'u/FranzyllTheory'
})

// Filter posts matching the current user's author name
const userPosts = computed(() => {
  if (!posts.value || !Array.isArray(posts.value)) return []
  return posts.value.filter(post => post.author?.name === currentUser.value.name)
})
</script>

<template>
  <div class="profile-page">
    <!-- Profile Header Container -->
    <header class="profile-header-container">
      <img
        class="profile-banner"
        src="https://placehold.co/1440x200"
        alt="User Profile Banner"
      />

      <div class="profile-info-block">
        <div class="avatar-overlap-wrapper">
          <div class="avatar-ring"></div>
        </div>
        <div class="avatar-placeholder-spacer"></div>

        <div class="user-meta-main">
          <div class="name-row">
            <div class="names">
              <h1 class="user-display-name">EcoWarrior42</h1>
              <span class="user-subtext">u/EcoWarrior42 • Joined Oct 2019</span>
            </div>
            <button class="btn-edit-profile">
              Edit Profile
            </button>
          </div>
          <p class="user-bio">
            Composting enthusiast & zero-waste advocate. Turning trash into treasure since 2019. 🌱
          </p>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="profile-stats-row">
        <div class="stat-item">
          <span class="stat-value">247</span>
          <span class="stat-label">Items Donated</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">12</span>
          <span class="stat-label">Projects Supported</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">89 lbs</span>
          <span class="stat-label">Materials Collected</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">4.9/5</span>
          <span class="stat-label">Community Score</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class="profile-tabs" aria-label="Profile section tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'posts' }"
          @click="activeTab = 'posts'"
        >
          Posts
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'donations' }"
          @click="activeTab = 'donations'"
        >
          Donations
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'saved' }"
          @click="activeTab = 'saved'"
        >
          Saved Projects
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button>
      </nav>
    </header>

    <!-- Main Content Layout Area -->
    <div class="main-layout-wrapper">
      <!-- Left Feed Area -->
      <section class="left-feed-column">
        <template v-if="activeTab === 'posts'">
          <PostCard
            v-for="post in userPosts"
            :key="post.id"
            :post="post"
          />
        </template>
        <div v-else class="tab-placeholder-card">
          <p>Displaying {{ activeTab }} content...</p>
        </div>
      </section>

      <!-- Right Sidebar Area -->
      <aside class="right-sidebar-column">
        <DonationHistoryCard />
        <SavedProjectsCard />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  min-height: 100vh;
  padding-bottom: 80px;
  background: var(--color-bg-main, #F7F8F6);
}

.profile-header-container {
  width: 100%;
  background: white;
  border-bottom: 1px solid #E4E7E3;
  display: flex;
  flex-direction: column;
}

.profile-banner {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.profile-info-block {
  padding: 0 80px 24px 80px;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.avatar-overlap-wrapper {
  width: 120px;
  height: 120px;
  position: absolute;
  left: 80px;
  top: -60px;
}

.avatar-ring {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 9999px;
  border: 4px solid #E4E7E3;
}

.avatar-placeholder-spacer {
  width: 120px;
  height: 60px;
  flex-shrink: 0;
}

.user-meta-main {
  flex: 1;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.names {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-display-name {
  margin: 0;
  color: #1A1D1A;
  font-size: 24px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.user-subtext {
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.btn-edit-profile {
  padding: 8px 20px;
  background: var(--color-brand, #778732);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-edit-profile:hover {
  opacity: 0.9;
}

.user-bio {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  line-height: 1.5;
}

.profile-stats-row {
  height: 72px;
  padding: 0 80px;
  background: #F7F8F6;
  border-top: 1px solid #E4E7E3;
  border-bottom: 1px solid #E4E7E3;
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value {
  color: #1A1D1A;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.stat-label {
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.profile-tabs {
  height: 48px;
  padding: 0 80px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0 0 12px 0;
  color: #8F9A8F;
  font-size: 15px;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: var(--color-brand, #778732);
  font-weight: 600;
  border-bottom-color: var(--color-brand, #778732);
}

.main-layout-wrapper {
  max-width: 1380px;
  margin: 0 auto;
  padding: 24px 80px 0 80px;
  display: flex;
  gap: 32px;
}

.left-feed-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.right-sidebar-column {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-placeholder-card {
  padding: 32px;
  background: white;
  border-radius: 12px;
  border: 1px solid #E4E7E3;
  color: #8F9A8F;
  text-align: center;
}

@media (max-width: 1024px) {
  .main-layout-wrapper {
    flex-direction: column;
    padding: 24px 24px 0 24px;
  }

  .profile-info-block,
  .profile-stats-row,
  .profile-tabs {
    padding-left: 24px;
    padding-right: 24px;
  }

  .right-sidebar-column {
    width: 100%;
  }
}
</style>
