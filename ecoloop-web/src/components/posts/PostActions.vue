<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Share2, Bookmark } from 'lucide-vue-next'
import DonateMaterialsModal from '../Modals/DonateMaterialsModal.vue'
import EditPostModal from '../Modals/EditPostModal.vue'
import ThankYouDonationModal from '../Modals/ThankYouDonationModal.vue'
import { supabase } from '../../composables/useAuth'

function handlePostUpdated() {
  window.location.reload() // Quickest way to see changes!
}

const props = defineProps<{
  comments: number
  postId?: string | number
  hideComments?: boolean
  projectName?: string
  authorUsername?: string
  isOwner?: boolean
}>()

defineEmits<{ share: []; save: []; donate: []; map: [] }>()

const router = useRouter()

// Modal Visibility Controls
const showDonateModal = ref(false)
const showThankYouModal = ref(false)
const showEditModal = ref(false)

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

// SAFEGUARD: Don't open the modal if the post is from mock data
function handleDonateClick() {
  if (!props.postId || String(props.postId).length < 20) {
    alert("Cannot donate to this post: It's using mock data without a real Database UUID.")
    return
  }
  showDonateModal.value = true
}

// Called when DonateMaterialsModal emits 'submitted'
function handleDonationSubmitted(payload: { pledgeId: string; quantity: number; materialName: string }) {
  console.log('Pledge created successfully with ID:', payload.pledgeId)
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

// Add refs to hold the fetched data
const fetchedProjectName = ref(props.projectName || '')
const fetchedAuthorName = ref(props.authorUsername || '')

onMounted(async () => {
  // If we already have them from props, skip the query
  if (fetchedProjectName.value && fetchedAuthorName.value) return
  if (!props.postId) return

  // 1. Removed the complex alias, just requesting 'profiles'
  const { data, error } = await supabase
    .from('cause_requests')
    .select(`
      title,
      profiles (
        full_name
      )
    `)
    .eq('id', props.postId)
    .single()

  if (!error && data) {
    // 2. Cast data as 'any' to bypass TypeScript's strict type checking
    const postData = data as any

    fetchedProjectName.value = postData.title

    // 3. Profiles comes back as an object (or array depending on PostgREST version),
    // so we safely check for full_name
    let authorName = 'Unknown User'
    if (postData.profiles) {
      // If it returned an array for some reason, grab the first item, otherwise grab the object
      const profileInfo = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles
      authorName = profileInfo?.full_name || 'Unknown User'
    }

    fetchedAuthorName.value = authorName
  } else if (error) {
    console.error('Error fetching author details:', error.message)
  }
})

</script>

<template>
  <div class="post-footer">
    <div class="actions-left">
      <button v-if="!hideComments" class="footer-action" @click="openPost">
        <MessageCircle :size="14" />
        <span>{{ comments }} Comments</span>
      </button>

      <button class="footer-action" @click="$emit('share')">
        <Share2 :size="14" />
        <span>Share</span>
      </button>

      <button class="footer-action" @click="$emit('save')">
        <Bookmark :size="14" />
        <span>Save</span>
      </button>
    </div>

    <!-- HIDE button if the user is the owner -->
    <button v-if="!isOwner" class="btn-donate" @click="handleDonateClick">
      Donate
    </button>

    <button v-if="isOwner" class="btn-manage" @click="showEditModal = true">
      Edit Post
    </button>

    <!-- Step 1: Donation Form Modal -->
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

    <!-- Step 2: Thank You Confirmation Modal -->
    <ThankYouDonationModal
      v-model="showThankYouModal"
      :quantity="donationSummary.quantity"
      :material-name="donationSummary.materialName"
      :project-name="props.projectName"
      :author-username="props.authorUsername"
      @view-donations="handleViewDonations"
      @back-to-post="handleBackToPost"
    />
  </div>
</template>

<style scoped>
/* ==========================================================================
   POST FOOTER CONTAINER
   ========================================================================== */
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

/* ==========================================================================
   LEFT ACTIONS GROUP
   ========================================================================== */
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
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.footer-action:hover {
  background: #e4e7e3;
  color: #1a1d1a;
}

/* ==========================================================================
   DONATE BUTTON
   ========================================================================== */
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

.btn-donate:hover {
  background: #4f5b1d;
}
/* Add this right below your .btn-donate CSS */
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
