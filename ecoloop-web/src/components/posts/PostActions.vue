<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Share2, Bookmark, Heart } from 'lucide-vue-next'
import DonateMaterialsModal from '../Modals/DonateMaterialsModal.vue'
import EditPostModal from '../Modals/EditPostModal.vue'
import ThankYouDonationModal from '../Modals/ThankYouDonationModal.vue'
import { supabase } from '../../composables/useAuth'

function handlePostUpdated() {
  window.location.reload()
}

const props = defineProps<{
  comments: number
  votes: number // <-- Added for Likes
  postId?: string | number
  hideComments?: boolean
  projectName?: string
  authorUsername?: string
  isOwner?: boolean
  isCompleted?: boolean // <-- Added for Completion State
}>()

defineEmits<{ share: []; save: []; donate: []; map: [] }>()

const router = useRouter()

// Modal Visibility Controls
const showDonateModal = ref(false)
const showThankYouModal = ref(false)
const showEditModal = ref(false)

// Like State
const localVotes = ref(props.votes || 0)
const hasLiked = ref(false)
const isLiking = ref(false)

// Donation Summary State
const donationSummary = ref({
  quantity: 1,
  materialName: 'Materials'
})

function openPost() {
  if (props.postId) {
    router.push(`/post/${props.postId}`)
  }
}

function handleDonateClick() {
  if (props.isCompleted) return // Block if completed

  if (!props.postId || String(props.postId).length < 20) {
    alert("Cannot donate to this post: It's using mock data without a real Database UUID.")
    return
  }
  showDonateModal.value = true
}

function handleDonationSubmitted(payload: { pledgeId: string; quantity: number; materialName: string }) {
  donationSummary.value = {
    quantity: payload.quantity,
    materialName: payload.materialName
  }
  showDonateModal.value = false
  showThankYouModal.value = true
}

function handleViewDonations() {
  router.push('/profile')
}

function handleBackToPost() {
  if (props.postId) {
    router.push(`/post/${props.postId}`)
  }
}

// Like Toggle Logic
async function toggleLike() {
  if (!props.postId || isLiking.value) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    alert('Please log in to like posts.')
    return
  }

  isLiking.value = true
  const userId = session.user.id

  try {
    if (hasLiked.value) {
      // Unlike
      await supabase.from('post_likes').delete().eq('post_id', props.postId).eq('user_id', userId)
      localVotes.value--
      hasLiked.value = false
    } else {
      // Like
      await supabase.from('post_likes').insert({ post_id: props.postId, user_id: userId })
      localVotes.value++
      hasLiked.value = true
    }
  } catch (err) {
    console.error('Error toggling like:', err)
  } finally {
    isLiking.value = false
  }
}

// Fetch Author Details and Initial Like State
const fetchedProjectName = ref(props.projectName || '')
const fetchedAuthorName = ref(props.authorUsername || '')

onMounted(async () => {
  if (!props.postId) return

  const { data: { session } } = await supabase.auth.getSession()

  // 1. Check if the user has already liked this post
  if (session?.user?.id) {
    const { data: likeData } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', props.postId)
      .eq('user_id', session.user.id)
      .single()

    if (likeData) hasLiked.value = true
  }

  // 2. Fetch Author if missing
  if (!fetchedProjectName.value || !fetchedAuthorName.value) {
    const { data, error } = await supabase
      .from('cause_requests')
      .select(`title, profiles(full_name)`)
      .eq('id', props.postId)
      .single()

    if (!error && data) {
      const postData = data as any
      fetchedProjectName.value = postData.title

      let authorName = 'Unknown User'
      if (postData.profiles) {
        const profileInfo = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles
        authorName = profileInfo?.full_name || 'Unknown User'
      }
      fetchedAuthorName.value = authorName
    }
  }
})
</script>

<template>
  <div class="post-footer">
    <div class="actions-left">
      <!-- New Like Button -->
      <button class="footer-action" :class="{ 'is-liked': hasLiked }" @click.stop="toggleLike">
        <Heart :size="14" :fill="hasLiked ? 'currentColor' : 'none'" />
        <span>{{ localVotes }} Likes</span>
      </button>

      <button v-if="!hideComments" class="footer-action" @click="openPost">
        <MessageCircle :size="14" />
        <span>{{ comments }} Comments</span>
      </button>

      <button class="footer-action" @click.stop="$emit('share')">
        <Share2 :size="14" />
        <span>Share</span>
      </button>

      <button class="footer-action" @click.stop="$emit('save')">
        <Bookmark :size="14" />
        <span>Save</span>
      </button>
    </div>

    <!-- Disabled State Check added here -->
    <button
      v-if="!isOwner"
      class="btn-donate"
      :class="{ 'btn-completed': isCompleted }"
      :disabled="isCompleted"
      @click.stop="handleDonateClick"
    >
      {{ isCompleted ? 'Goal Reached' : 'Donate' }}
    </button>

    <button v-if="isOwner" class="btn-manage" @click.stop="showEditModal = true">
      Edit Post
    </button>

    <!-- Modals -->
    <DonateMaterialsModal
      v-model="showDonateModal"
      :post-id="String(postId ?? '')"
      @submitted="handleDonationSubmitted"
    />

    <EditPostModal
      v-model="showEditModal"
      :post-id="String(postId ?? '')"
      @updated="handlePostUpdated"
    />

    <ThankYouDonationModal
      v-model="showThankYouModal"
      :quantity="donationSummary.quantity"
      :material-name="donationSummary.materialName"
      :project-name="fetchedProjectName"
      :author-username="fetchedAuthorName"
      @view-donations="handleViewDonations"
      @back-to-post="handleBackToPost"
    />
  </div>
</template>

<style scoped>
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #f0f2ef;
  gap: 12px;
  box-sizing: border-box;
}

.actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f7f8f6;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-action:hover {
  background: #e4e7e3;
  color: #1a1d1a;
}

/* Liked State CSS */
.footer-action.is-liked {
  color: #ef4444; /* Red color for likes */
  background: #fef2f2;
}

.footer-action.is-liked:hover {
  background: #fee2e2;
}

.btn-donate {
  height: 32px;
  padding: 0 50px;
  background: #617024;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  margin-left: auto;
  transition: background-color 0.2s ease;
}

.btn-donate:hover:not(:disabled) {
  background: #4f5b1d;
}

/* Completed Disabled State CSS */
.btn-completed {
  background: #e4e7e3;
  color: #8f9a8f;
  cursor: not-allowed;
}

.btn-manage {
  height: 32px;
  padding: 0 45px;
  background: #f0f4ea;
  border: 1px solid #778732;
  border-radius: 8px;
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  transition: all 0.2s ease;
}
.btn-manage:hover {
  background: #e4eadb;
}
</style>
