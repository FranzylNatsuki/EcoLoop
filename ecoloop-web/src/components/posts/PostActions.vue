<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Share2, Bookmark } from 'lucide-vue-next'
import DonateMaterialsModal from '../Modals/DonateMaterialsModal.vue'
import ThankYouDonationModal from '../Modals/ThankYouDonationModal.vue'

const props = defineProps<{
  comments: number
  postId?: string | number
  hideComments?: boolean
  projectName?: string
  authorUsername?: string
}>()

defineEmits<{ share: []; save: []; donate: []; map: [] }>()

const router = useRouter()

// Modal Visibility Controls
const showDonateModal = ref(false)
const showThankYouModal = ref(false)

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

// Called when DonateMaterialsModal emits 'submitted'
function handleDonationSubmitted(payload: { quantity: number; materialName: string }) {
  donationSummary.value = payload
  showDonateModal.value = false
  showThankYouModal.value = true
}

// Router actions for ThankYou modal callbacks
function handleViewDonations() {
  router.push('/profile') // Adjust to your preferred route (e.g. '/donations' or '/profile')
}

function handleBackToPost() {
  if (props.postId) {
    router.push(`/post/${props.postId}`)
  }
}
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

    <button class="btn-donate" @click="$emit('donate'); showDonateModal = true">
      Donate
    </button>

    <!-- Step 1: Donation Form Modal -->
    <DonateMaterialsModal
      v-model="showDonateModal"
      @submitted="handleDonationSubmitted"
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
  transition: background-color 0.2s ease;
}

.btn-donate:hover {
  background: #4f5b1d;
}
</style>
