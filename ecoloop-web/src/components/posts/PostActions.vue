<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Share2, Bookmark } from 'lucide-vue-next'
import DonateMaterialsModal from '../Modals/DonateMaterialsModal.vue'

const props = defineProps<{
  comments: number
  postId?: string | number
  hideComments?: boolean
}>()

defineEmits<{ share: []; save: []; donate: []; map: [] }>()

const router = useRouter()
const showDonateModal = ref(false)

function openPost() {
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

    <DonateMaterialsModal v-model="showDonateModal" />
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
