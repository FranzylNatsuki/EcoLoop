<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../composables/useAuth'
import { usePosts } from '../composables/usePosts'
import PostCard from '../components/posts/PostCard.vue'
import BackButton from '../components/common/BackButton.vue'
import DonationCard from '../components/posts/DonationCard.vue'
import { BadgeCheck } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const targetUserId = route.params.id as string

const activeTab = ref('posts')
const profileData = ref<any>(null)
const isLoading = ref(true)
const publicPledges = ref<any[]>([])

// --- Rating State ---
const currentUserId = ref<string | null>(null)
const myRating = ref(0)
const hoverRating = ref(0)
const isSubmittingRating = ref(false)

const { posts } = usePosts()

onMounted(async () => {
  if (!targetUserId) {
    console.error("No user ID provided in URL.")
    isLoading.value = false
    return
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    currentUserId.value = session.user.id
    if (session.user.id === targetUserId) {
      console.log("User clicked their own profile. Redirecting to private dashboard...")
      router.push('/profile')
      return
    }

    // Fetch if the current user has already rated this profile
    const { data: existingRating } = await supabase
      .from('user_ratings')
      .select('score')
      .eq('rater_id', session.user.id)
      .eq('ratee_id', targetUserId)
      .maybeSingle()

    if (existingRating) {
      myRating.value = existingRating.score
    }
  }

  // Fetch the target user's data with organizations table join
  const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_data (*),
          organizations!organization_id (*)
        `)
        .eq('id', targetUserId)
        .single()

  if (error) console.error("Failed to fetch public profile:", error.message)
  if (data) profileData.value = data

  // Fetch completed pledges
  const { data: pledgesData, error: pledgesError } = await supabase
    .from('pledges')
    .select(`
      *,
      post:cause_requests(title, author_id),
      items:pledge_items(material_name, quantity, unit)
    `)
    .eq('donor_id', targetUserId)
    .eq('status', 'completed')

  const { data: eventPledgesData, error: eventPledgesError } = await supabase
    .from('event_pledges')
    .select(`
      *,
      post:events(title),
      items:event_pledge_items(material_name, quantity, unit)
    `)
    .eq('donor_id', targetUserId)
    .eq('status', 'completed')

  let combinedPledges: any[] = []

  if (!pledgesError && pledgesData) {
    const p = pledgesData.map((pl: any) => ({ ...pl, pledgeType: 'cause' }))
    combinedPledges = [...combinedPledges, ...p]
  }

  if (!eventPledgesError && eventPledgesData) {
    const ep = eventPledgesData.map((pl: any) => ({ ...pl, pledgeType: 'event' }))
    combinedPledges = [...combinedPledges, ...ep]
  }

  combinedPledges.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  publicPledges.value = combinedPledges

  isLoading.value = false
})

const userPledges = computed(() => {
  if (!publicPledges.value) return []
  // Filter out any donations they made to their own projects
  return publicPledges.value.filter(pledge => pledge.post?.author_id !== targetUserId)
})

const computedItemsDonated = computed(() => {
  return userPledges.value.reduce((sum, pledge) => {
    if (pledge.status !== 'completed') return sum
    const itemsSum = pledge.items?.reduce((s: number, item: any) => s + (Number(item.quantity) || 0), 0) || 0
    return sum + itemsSum
  }, 0)
})

const computedProjectsSupported = computed(() => {
  const completedPledges = userPledges.value.filter(p => p.status === 'completed')
  const uniqueProjects = new Set(completedPledges.map(p => p.post_id || p.event_id || p.id))
  return uniqueProjects.size
})

const userPosts = computed(() => {
  if (!posts.value || !Array.isArray(posts.value) || !profileData.value) return []
  return posts.value.filter(post => post.author?.full_name === profileData.value.full_name)
})

// --- Submit Rating Logic ---
async function submitRating(score: number) {
  if (!currentUserId.value || isSubmittingRating.value) return

  isSubmittingRating.value = true
  myRating.value = score

  try {
    const { error } = await supabase
      .from('user_ratings')
      .upsert({
        rater_id: currentUserId.value,
        ratee_id: targetUserId,
        score: score
      }, {
        onConflict: 'rater_id, ratee_id'
      })

    if (error) throw error

    // Optimistically update the UI score visually
    if (profileData.value?.profile_data) {
      // Re-fetch just the score to ensure mathematical accuracy from the database trigger
      const { data: updatedStats } = await supabase
        .from('profile_data')
        .select('"CommunityScore"')
        .eq('id', targetUserId)
        .single()

      if (updatedStats) {
        profileData.value.profile_data.CommunityScore = updatedStats.CommunityScore
      }
    }
  } catch (err: any) {
    console.error("Failed to submit rating:", err.message)
    alert("Could not save rating.")
  } finally {
    isSubmittingRating.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-header-container">
      <img class="profile-banner" src="../assets/profile-banner.png" alt="User Profile Banner" />

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
              <h1 class="user-display-name">
                {{ profileData.full_name }}
                <BadgeCheck
                  v-if="profileData.is_org && profileData.organizations?.verification_status === 'verified'"
                  fill="#3B82F6"
                  color="white"
                  :size="24"
                  class="verified-badge"
                />
              </h1>
              <span class="user-subtext">Joined {{ new Date(profileData.created_at).getFullYear() }}</span>
            </div>

            <!-- Follow & Rating Block -->
            <div class="actions-block">
              <!-- Interactive Star Rating System -->
              <div v-if="currentUserId" class="rating-widget">
                <span class="rating-label">Rate:</span>
                <div class="stars-container" @mouseleave="hoverRating = 0">
                  <button
                    v-for="star in 5"
                    :key="star"
                    class="star-btn"
                    :class="{ 'is-active': star <= (hoverRating || myRating) }"
                    :disabled="isSubmittingRating"
                    @mouseover="hoverRating = star"
                    @click="submitRating(star)"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
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
            <span class="stat-value">{{ computedItemsDonated }}</span>
            <span class="stat-label">Items Donated</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ computedProjectsSupported }}</span>
            <span class="stat-label">Projects Supported</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileData.profile_data?.CommunityScore || 0 }}/5</span>
            <span class="stat-label">Community Score</span>
          </div>
        </div>
      </div>
      <div class="profile-stats-wrapper" v-else></div>

      <nav class="profile-tabs" aria-label="Profile section tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
          Posts
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'donations' }" @click="activeTab = 'donations'">
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
          <PostCard v-else v-for="post in userPosts" :key="post.id" :post="post" />
        </template>

        <!-- RECENT ACTIVITY (DONATIONS) TAB -->
        <template v-else-if="activeTab === 'donations'">
          <div v-if="userPledges.length === 0" class="tab-placeholder-card">
            <p>No completed donations to other projects yet.</p>
          </div>

          <DonationCard
            v-else
            v-for="pledge in userPledges"
            :key="pledge.id"
            :pledge="pledge"
          />
        </template>
      </section>

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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 40px 24px 40px;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  box-sizing: border-box;
}

.avatar-overlap-wrapper {
  width: 120px;
  height: 120px;
  position: absolute;
  left: 40px;
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
  align-items: flex-start;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.verified-badge {
  flex-shrink: 0;
}

.user-subtext {
  color: #8F9A8F;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
}

.actions-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.btn-edit-profile {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-edit-profile:hover {
  opacity: 0.9;
}

/* --- Rating Widget CSS --- */
.rating-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F7F8F6;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #E4E7E3;
}

.rating-label {
  font-size: 12px;
  font-weight: 600;
  color: #525A52;
  font-family: 'Outfit', sans-serif;
}

.stars-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #D1D5DB;
  transition: color 0.15s ease, transform 0.1s ease;
}

.star-btn svg {
  width: 16px;
  height: 16px;
}

.star-btn.is-active {
  color: #F59E0B;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* ------------------------ */

.user-bio {
  margin: 0;
  color: #525A52;
  font-size: 14px;
  font-family: 'Geist', sans-serif;
  line-height: 1.5;
  max-width: 800px;
}

.profile-stats-wrapper {
  width: 100%;
  background: #F7F8F6;
  border-top: 1px solid #E4E7E3;
  border-bottom: 1px solid #E4E7E3;
}

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
  max-width: 1100px;
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
  .profile-stats-inner,
  .profile-tabs {
    padding-left: 24px;
    padding-right: 24px;
  }

  .right-sidebar-column {
    width: 100%;
  }
}
</style>
