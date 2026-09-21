<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../composables/useAuth'
import { usePosts } from '../composables/usePosts'
import PostCard from '../components/posts/PostCard.vue'
import DonationHistoryCard from '../components/sidebar/DonationHistoryCard.vue'
import BackButton from '../components/common/BackButton.vue'
import DonationCard from '../components/posts/DonationCard.vue'

const route = useRoute()
const router = useRouter() // <--- Initialize it
// Grab the ID
// from the URL (e.g., /user/1234-5678-abcd)
const targetUserId = route.params.id as string

// Removed 'settings' and 'saved' (usually saved posts are private)
const activeTab = ref('posts')
const profileData = ref<any>(null)
const isLoading = ref(true)
const publicPledges = ref<any[]>([])

// Extract posts state
const { posts } = usePosts()

onMounted(async () => {
  if (!targetUserId) {
    console.error("No user ID provided in URL.")
    isLoading.value = false
    return
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (session && session.user.id === targetUserId) {
      console.log("User clicked their own profile. Redirecting to private dashboard...")
      router.push('/profile') // Send them to MyProfileView
      return // Stop running the rest of the code!
    }

  // Fetch the target user's data directly from the URL param
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      profile_data (*)
    `)
    .eq('id', targetUserId)
    .single()

  if (error) {
    console.error("Failed to fetch public profile:", error.message)
  }

  if (data) {
    profileData.value = data
  }

  const { data: pledgesData, error: pledgesError } = await supabase
      .from('pledges')
      .select(`
        *,
        post:cause_requests(title),
        items:pledge_items(material_name, quantity, unit)
      `)
      .eq('donor_id', targetUserId)
      .eq('status', 'completed') // Only show completed donations publicly
      .order('created_at', { ascending: false })

    if (!pledgesError && pledgesData) {
      publicPledges.value = pledgesData
    }

  isLoading.value = false
})

// Filter posts matching this specific user
const userPosts = computed(() => {
  if (!posts.value || !Array.isArray(posts.value) || !profileData.value) return []
  return posts.value.filter(post => post.author?.full_name === profileData.value.full_name)
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-header-container">
      <img
        class="profile-banner"
        src="../assets/profile-banner.png"
        alt="User Profile Banner"
      />

      <div class="profile-info-block" v-if="!isLoading && profileData">
        <div class="avatar-overlap-wrapper">
          <img
            class="avatar-ring"
            :src="profileData.profile_data?.Avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
            alt="Avatar"
            style="object-fit: cover;"
          />
        </div>
        <div class="avatar-placeholder-spacer"></div>

        <div class="user-meta-main">
          <div class="name-row">
            <div class="names">
              <h1 class="user-display-name">{{ profileData.full_name }}</h1>
              <span class="user-subtext">Joined {{ new Date(profileData.created_at).getFullYear() }}</span>
            </div>

            <!-- Replaced Edit Profile with a public interaction button -->
            <button class="btn-edit-profile" style="background: rgba(119, 135, 50, 0.1); color: #778732;">
              Follow User
            </button>
          </div>

          <p class="user-bio">
            {{ profileData.profile_data?.about || 'No bio provided yet.' }}
          </p>
        </div>
      </div>

      <div class="profile-info-block" v-else>
        <div class="avatar-placeholder-spacer"></div>
        <div class="user-meta-main">
          <p v-if="isLoading">Loading profile...</p>
          <p v-else>User not found.</p>
        </div>
      </div>

      <div class="profile-stats-wrapper" v-if="!isLoading && profileData">
        <div class="profile-stats-inner">
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.ItemsDonated || 0 }}</span>
            <span class="stat-label">Items Donated</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.ProjectsSupported || 0 }}</span>
            <span class="stat-label">Projects Supported</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.MaterialsCollected || 0 }} lbs</span>
            <span class="stat-label">Materials Collected</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.CommunityScore || 0 }}/5</span>
            <span class="stat-label">Community Score</span>
          </div>
        </div>
      </div>
      <div class="profile-stats-wrapper" v-else></div>

      <!-- Stripped out 'Saved' and 'Settings' since this is a public view -->
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
          Recent Activity
        </button>
      </nav>
    </header>


    <div class="main-layout-wrapper">
      <section class="left-feed-column">
                      <BackButton />
        <template v-if="activeTab === 'posts'">
          <div v-if="userPosts.length === 0" class="tab-placeholder-card">
            <p>This user hasn't posted anything yet.</p>
          </div>

          <PostCard
            v-else
            v-for="post in userPosts"
            :key="post.id"
            :post="post"
          />
        </template>

        <template v-else-if="activeTab === 'donations'">
                  <div v-if="publicPledges.length === 0" class="tab-placeholder-card">
                    <p>No recent activity to display.</p>
                  </div>

                  <DonationCard
                    v-else
                    v-for="pledge in publicPledges"
                    :key="pledge.id"
                    :pledge="pledge"
                  />
                </template>

        <div v-else class="tab-placeholder-card">
          <p>No recent activity to display.</p>
        </div>
      </section>

      <aside class="right-sidebar-column">
        <DonationHistoryCard />
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
  width: 100%;
  max-width: 1100px; /* This pulls it closer to the center! */
  margin: 0 auto;
  padding: 0 40px 24px 40px; /* Reduced side padding slightly */
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  box-sizing: border-box; /* Keeps padding inside the width */
}

.avatar-overlap-wrapper {
  width: 120px;
  height: 120px;
  position: absolute;
  left: 40px; /* Matches the new padding from the info block */
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

/* The wrapper handles the 100% full-screen background and borders */
.profile-stats-wrapper {
  width: 100%;
  background: #F7F8F6;
  border-top: 1px solid #E4E7E3;
  border-bottom: 1px solid #E4E7E3;
}

/* The inner container perfectly aligns with your Avatar and Name */
.profile-stats-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  height: 72px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-sizing: border-box;
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
  width: 100%;
  max-width: 1100px; /* Matches info block width */
  margin: 0 auto;
  height: 48px;
  padding: 0 40px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  box-sizing: border-box;
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
