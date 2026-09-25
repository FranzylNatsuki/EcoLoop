<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'

interface ProfileData {
  Avatar?: string
}

interface UserSuggestion {
  id: string | number
  full_name: string
  location?: string
  profile_data?: ProfileData | ProfileData[]
}

const props = defineProps<{ user: UserSuggestion }>()
const router = useRouter()

const avatarUrl = computed(() => {
  const profileData = Array.isArray(props.user.profile_data)
    ? props.user.profile_data[0]
    : props.user.profile_data
  return profileData?.Avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
})

function openProfile() {
  router.push(`/profile/${props.user.id}`)
}
</script>

<template>
  <article class="user-card" @click="openProfile">
    <img :src="avatarUrl" :alt="user.full_name" class="avatar" />

    <div class="user-content">
      <h2>{{ user.full_name }}</h2>
      <p v-if="user.location" class="location">{{ user.location }}</p>
    </div>

    <span class="view-profile">View profile</span>
  </article>
</template>

<style scoped>
.user-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.user-card:hover {
  border-color: #cfd6cc;
  box-shadow: 0 2px 8px rgba(31, 41, 33, 0.06);
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-content {
  flex: 1;
  min-width: 0;
}

.user-content h2 {
  margin: 0 0 2px;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: #1a1d1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location {
  margin: 0;
  color: #525a52;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-profile {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(119, 135, 50, 0.1);
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
