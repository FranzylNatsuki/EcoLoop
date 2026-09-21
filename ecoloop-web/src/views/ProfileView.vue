<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../composables/useAuth'
import PostCard from '../components/posts/PostCard.vue'
import DonationHistoryCard from '../components/sidebar/DonationHistoryCard.vue'
import SavedProjectsCard from '../components/sidebar/SavedProjectsCard.vue'
import EditProfileModal from '../components/Modals/EditProfileModal.vue'
import { usePosts } from '../composables/usePosts'
import BackButton from '../components/common/BackButton.vue'
import DonationCard from '../components/posts/DonationCard.vue'

const activeTab = ref('posts')
const profileData = ref<any>(null)
const isLoading = ref(true)
const isEditModalOpen = ref(false)
const userPledges = ref<any[]>([])

// Extract posts state and fetch method from composable
const { posts } = usePosts()

// Fetch posts on view mount
onMounted(async () => {
  // 1. Actively await the session directly from Supabase so we don't race the initial load
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const userId = session.user.id
    console.log("Session found! Fetching data for:", userId)

    // 2. Fetch from your profiles and profile_data tables
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_data (*)
      `)
      .eq('id', userId)
      .single()

    const { data: pledgesData, error: pledgesError } = await supabase
          .from('pledges')
          .select(`
            *,
            post:cause_requests(title),
            items:pledge_items(material_name, quantity, unit)
          `)
          .eq('donor_id', userId)
          .order('created_at', { ascending: false })

    if (!pledgesError && pledgesData) {
      userPledges.value = pledgesData
    }

    // 3. Log any database errors (like RLS or empty tables)
    if (error) {
      console.error("Database Error:", error.message)
    }

    if (data) {
      console.log("Success! Profile Data:", data)
      profileData.value = data
    }
  } else {
    console.warn("No session found at all.")
  }

  isLoading.value = false
})

// The function that runs when the modal emits 'save'
const handleSaveProfile = async (updatedData: any) => {
  console.log("SAVE BUTTON CLICKED! Data received:", updatedData)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
      console.error("No session found during save! Are you logged out?")
      return
  }

  const userId = session.user.id
  let finalAvatarUrl = updatedData.avatarPreview

  // 1. Upload new avatar if one was selected
  if (updatedData.avatarFile) {
    const fileExt = updatedData.avatarFile.name.split('.').pop()
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, updatedData.avatarFile, { upsert: true })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError.message)
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      finalAvatarUrl = data.publicUrl
    }
  }

  // 2. Update profiles table
  const { error: profileError } = await supabase.from('profiles')
    .update({
      full_name: updatedData.fullName,
      location: updatedData.location,
      contact_number: updatedData.contact
    })
    .eq('id', userId)

  if (profileError) console.error("Profile Update Error:", profileError.message)

  // 3. Update profile_data table
  const { error: dataError } = await supabase.from('profile_data')
    .update({
      about: updatedData.about,
      Avatar: finalAvatarUrl
    })
    .eq('id', userId)

  if (dataError) console.error("Profile Data Update Error:", dataError.message)

  // 4. Safely update the UI instantly
  if (!profileError && !dataError && profileData.value) {
    profileData.value.full_name = updatedData.fullName
    profileData.value.location = updatedData.location
    profileData.value.contact_number = updatedData.contact

    // Safety check: Create the nested object if it doesn't exist yet!
    if (!profileData.value.profile_data) {
      profileData.value.profile_data = {}
    }

    profileData.value.profile_data.about = updatedData.about
    profileData.value.profile_data.Avatar = finalAvatarUrl
  }
}

// Filter posts matching the logged-in user's database name
const userPosts = computed(() => {
  // If posts aren't loaded, or the profile isn't loaded yet, return an empty array
  if (!posts.value || !Array.isArray(posts.value) || !profileData.value) return []

  // Update: Match against full_name instead of name
  return posts.value.filter(post => post.author?.full_name === profileData.value.full_name)
})

</script>

<template>
  <div class="profile-page">
    <!-- Profile Header Container -->
    <header class="profile-header-container">
      <img
        class="profile-banner"
        src="../assets/profile-banner.png"
        alt="User Profile Banner"
      />

      <div class="profile-info-block" v-if="!isLoading && profileData">
        <div class="avatar-overlap-wrapper">
          <!-- Dynamic Avatar with fallback -->
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
              <!-- Dynamic Name, Email, and Year -->
              <h1 class="user-display-name">{{ profileData.full_name }}</h1>
              <span class="user-subtext">{{ profileData.email }} • Joined {{ new Date(profileData.created_at).getFullYear() }}</span>
            </div>
            <button class="btn-edit-profile" @click="isEditModalOpen = true">
              Edit Profile
            </button>
          </div>
          <!-- Dynamic Bio -->
          <p class="user-bio">
            {{ profileData.profile_data?.about || 'No bio provided yet.' }}
          </p>
        </div>
      </div>

      <!-- Loading State Fallback -->
      <div class="profile-info-block" v-else>
        <div class="avatar-placeholder-spacer"></div>
        <div class="user-meta-main">
          <p>Loading profile...</p>
        </div>
      </div>

      <!-- Stats Bar: Dynamic Numbers -->
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
        <!--
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button> -->
      </nav>
    </header>
    <!-- Main Content Layout Area -->
    <div class="main-layout-wrapper">
      <!-- Left Feed Area -->
      <section class="left-feed-column">
                  <BackButton />
        <template v-if="activeTab === 'posts'">
          <PostCard
            v-for="post in userPosts"
            :key="post.id"
            :post="post"
          />
        </template>

        <template v-else-if="activeTab === 'donations'">
                  <div v-if="userPledges.length === 0" class="empty-state">No completed donations yet.</div>
                  <DonationCard
                    v-for="pledge in userPledges"
                    :key="pledge.id"
                    :pledge="pledge"
                  />
                </template>

        <div v-else class="tab-placeholder-card">
          <p>Displaying {{ activeTab }} content...</p>
        </div>


      </section>

      <!-- Right Sidebar Area -->
      <aside class="right-sidebar-column">
        <!--<DonationHistoryCard />-->
        <SavedProjectsCard />
      </aside>
    </div>
  </div>
  <EditProfileModal
    v-model="isEditModalOpen"
    :initialData="profileData"
    @save="handleSaveProfile"
  />
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
