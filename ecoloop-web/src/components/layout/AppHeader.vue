<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { BellRing, ChevronDown, User, LogOut } from 'lucide-vue-next'
import CreatePostButton from './CreatePostButton.vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '../../composables/useAuth'
import NotificationDropdown from './NotificationDropdown.vue'
import { useSearch } from '../../composables/useSearch'

const isNotifOpen = ref(false)
const hasUnread = ref(false)
const router = useRouter()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const notifDropdownRef = ref<HTMLElement | null>(null)

const userAvatar = ref<string | null>(null)

const {
  searchInput,
  updateSearch,
  showSuggestions,
  suggestions
} = useSearch()

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const userId = session.user.id

    const { data: avatarData, error: avatarError } = await supabase
      .from('profile_data')
      .select('Avatar')
      .eq('id', userId)
      .single()

    if (!avatarError && avatarData?.Avatar) {
      userAvatar.value = avatarData.Avatar
    }

    const lastViewed = localStorage.getItem(`last_notif_viewed_${userId}`)

    let query = supabase
      .from('pledges')
      .select('id, post:cause_requests!inner(author_id)', { count: 'exact', head: true })
      .eq('cause_requests.author_id', userId)

    if (lastViewed) {
      query = query.gt('created_at', lastViewed)
    }

    const { count, error } = await query
    if (!error && count && count > 0) {
      hasUnread.value = true
    }
  }
})

const toggleNotifDropdown = async () => {
  isNotifOpen.value = !isNotifOpen.value
  isDropdownOpen.value = false

  if (isNotifOpen.value) {
    hasUnread.value = false
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      localStorage.setItem(`last_notif_viewed_${session.user.id}`, new Date().toISOString())
    }
  }
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const navigateToProfile = () => {
  isDropdownOpen.value = false
  router.push('/profile')
}

const handleLogout = async () => {
  isDropdownOpen.value = false
  await supabase.auth.signOut()
  router.push('/login')
}

const handleSuggestionClick = (item: any) => {
  if (item.type === 'user') {
    router.push(`/user/${item.id}`)
  } else if (item.type === 'event') {
    router.push(`/events/${item.id}`)
  } else {
    router.push(`/post/${item.id}`)
  }

  showSuggestions.value = false
  searchInput.value = ''
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node

  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    isDropdownOpen.value = false
  }

  if (notifDropdownRef.value && !notifDropdownRef.value.contains(target)) {
    isNotifOpen.value = false
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo">
        <RouterLink to="/home">
          <div data-svg-wrapper data-layer="Group 1" class="Group1" style="position: relative">
            <svg width="64" height="41" viewBox="0 0 64 41" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25.1875 0.413086L29.5225 1.8584L33.0322 3.92285L36.9551 7.63867V8.05176L37.5742 8.46484L38.1934 9.91016L38.6064 10.1162L38.8125 10.9424L39.2256 11.1484L40.6709 14.8643L41.29 17.9609V23.123H27.8711L28.4902 25.3936L29.5225 27.458L31.3809 29.7295H31.7939L33.8584 26.4258H40.2578L39.6387 28.6973L37.5742 32.2061L35.5098 34.2715V34.6836H35.0967V35.0967H34.6836L33.6514 36.3359H33.2383L31.5869 37.7803L28.4902 39.4326L26.0127 40.2578L19.6133 40.8779L16.5166 40.4648L11.9746 39.0195L11.7676 38.6064L10.1162 37.9873L9.91016 37.5742L8.25781 36.748L4.74805 33.4453V33.0322L3.92285 32.4131V32L2.27051 29.9355L0.826172 26.4258L0 22.5029V18.374L0.826172 14.2451L2.47754 10.5293L4.33594 8.25781V7.84473L7.43262 4.74805H7.84473L10.1162 2.89062L13.626 1.23828L16.7227 0.413086L21.0576 0L25.1875 0.413086ZM14.8643 7.22266L13.2129 8.04785L11.5615 9.49316H11.1484L8.46484 12.3838L6.40039 16.9258V23.7383L7.43262 26.6289L7.84473 26.835L8.05176 27.6611L9.49707 29.3125V29.7256L11.9746 31.9961L14.0391 33.2354H14.4512V32.4092L15.0713 32.2031H14.4512L12.3867 30.1387V27.6611L14.4512 26.0098L16.1035 25.3896H19.6133L20.0254 26.4219L20.6455 26.835V27.4541L18.9932 30.9639L20.8516 28.8994L22.2969 31.377L23.3291 34.4736L24.9805 34.2676L26.4258 33.6484V33.2354L24.5674 30.9639L22.5029 26.835L21.4707 22.293V18.5771L22.5029 14.0352L23.5352 11.5576L23.9482 11.3516L25.1875 8.87402L26.0127 8.46094L27.252 9.08008L30.5547 11.7646L28.4902 15.2734L28.0771 17.1318H34.8906V16.7188L34.2715 14.8613L32.6191 11.9707L31.1738 10.3193H30.7617L30.5547 9.69922H30.1416L28.9033 8.46094L26.2197 7.01562L24.1553 6.39648L18.5811 6.19043L14.8643 7.22266ZM14.4482 26.8359L13.21 27.8682V28.2812H16.3066L17.958 27.6611L18.9902 26.6289V26.0098H16.7197L14.4482 26.8359Z" fill="#778732"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M40.0529 0.206497H46.04L48.311 0.619401L51.4078 1.65166L55.7432 4.12908L59.2529 7.43231V7.84522L60.6981 9.29038L62.7626 13.4194L63.7949 17.342L64.0013 21.8839L63.1755 26.2194L61.111 30.7614L59.6658 32.413V32.8259L56.3626 36.1291H55.9497L55.3303 36.9549L52.8529 38.1936L52.6465 38.6065H52.0271L50.7884 39.4324L48.9303 40.0517L46.04 40.6711L42.1174 40.8775L38.8142 40.4646L34.6852 39.2259L33.24 38.1936L34.6852 37.3678L37.369 34.684L37.7819 33.8582L40.4658 34.684H45.4206L48.9303 33.6517L52.2336 31.7936L55.1239 28.9033L56.982 25.6001L57.8078 22.5033V18.5807L56.982 15.2775L55.7432 12.8001L52.8529 9.49683H52.44L50.7884 8.05167L47.4852 6.6065L44.1819 5.98715L40.4658 6.1936L37.9884 7.01941L35.7174 4.33553H35.3045L34.4787 3.30328L33.24 2.68392L33.4464 2.27102L35.3045 1.44521L40.0529 0.206497Z" fill="#86A2B1"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M50.1716 12.59L52.8555 13.8287L52.4426 15.2739L51.6168 15.8932L52.0297 17.9577L51.8232 20.2287L47.9006 28.0739L47.2813 28.6932H45.8361L42.9458 27.2481L42.3264 26.6287L42.12 25.5965L43.5652 22.4997L43.9781 22.2932V21.6739L44.5974 21.0545L45.0103 19.4029L45.4232 19.1965V18.5771L46.0426 17.9577L46.249 17.1319L46.6619 16.9255V16.5126H47.0748V16.0997L47.9006 15.8932L49.5523 14.6545V13.6223L50.1716 12.59Z" fill="#778732"/>
            </svg>
          </div>
        </RouterLink>
      </div>

      <div class="header-search">
        <input
          type="text"
          :value="searchInput"
          @input="e => updateSearch((e.target as HTMLInputElement).value)"
          @focus="showSuggestions = true"
          placeholder="Search posts, events, or locations..."
        />

        <transition name="dropdown-fade">
          <div
            v-if="showSuggestions && suggestions.length > 0 && searchInput.trim().length > 0"
            class="search-suggestions-dropdown"
          >
            <div
              v-for="item in suggestions"
              :key="item.id"
              class="suggestion-item"
              @click="handleSuggestionClick(item)"
            >
              <img
                v-if="item.type === 'user'"
                :src="item.avatar"
                class="suggestion-avatar"
                alt="User Avatar"
              />
              <span v-else class="suggestion-icon">
                {{ item.type === 'event' ? '📅' : '📝' }}
              </span>
              <span class="suggestion-title">{{ item.title }}</span>
            </div>
          </div>
        </transition>
      </div>

      <div class="header-actions">
        <CreatePostButton />

        <div class="profile-menu-container" ref="notifDropdownRef">
          <button class="icon-btn notif-btn" @click="toggleNotifDropdown">
            <BellRing :size="18" />
            <span v-if="hasUnread" class="unread-badge"></span>
          </button>
          <transition name="dropdown-fade">
            <NotificationDropdown v-if="isNotifOpen" />
          </transition>
        </div>

        <div class="profile-menu-container" ref="dropdownRef">
          <button class="profile" @click="toggleDropdown" :aria-expanded="isDropdownOpen">
            <img
              :src="userAvatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"
              alt="Your avatar"
              style="object-fit: cover;"
            />
            <ChevronDown :size="14" :class="{ 'icon-rotated': isDropdownOpen }" />
          </button>

          <transition name="dropdown-fade">
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <button class="dropdown-item" @click="navigateToProfile">
                <User :size="16" />
                <span>Profile</span>
              </button>
              <button class="dropdown-item logout-item" @click="handleLogout">
                <LogOut :size="16" />
                <span>Logout</span>
              </button>
            </div>
          </transition>
        </div>

      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7e3;
  display: flex;
  justify-content: center;
  align-items: center;
}
.header-container {
  width: 100%;
  max-width: 1344px;
  padding: 0 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}
.logo {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #778732;
  white-space: nowrap;
}
.header-search {
  flex: 1;
  max-width: 600px;
  position: relative;
}
.header-search input {
  width: 100%;
  height: 42px;
  border: 1px solid #e4e7e3;
  border-radius: 20px;
  padding: 0 16px;
  font-size: 14px;
  background: #f7f8f6;
  color: #1a1d1a;
  outline: none;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.btn-create-post {
  padding: 10px 18px;
  background: #778732;
  border-radius: 20px;
  border: none;
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn-create-post:hover {
  background: #617024;
}
.icon-wrapper {
  width: 14px;
  height: 14px;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.btn-text {
  color: #ffffff;
  font-size: 14px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  word-wrap: break-word;
}
.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #525a52;
}
.profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: 1px solid #e4e7e3;
  border-radius: 24px;
  background: transparent;
  cursor: pointer;
}
.profile img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 160px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  z-index: 50;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  font-size: 14px;
  color: #334155;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.dropdown-item:hover {
  background-color: #f1f5f9;
}
.logout-item:hover {
  color: #ef4444;
  background-color: #fef2f2;
}
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.profile-menu-container {
  position: relative;
  display: inline-block;
}
.notif-btn {
  position: relative;
}
.unread-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.search-suggestions-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
  z-index: 100;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.suggestion-item:hover {
  background-color: #f7f8f6;
}

.suggestion-icon {
  font-size: 14px;
  opacity: 0.7;
}

.suggestion-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e4e7e3;
}

.suggestion-title {
  font-size: 14px;
  color: #1a1d1a;
  font-family: 'Outfit', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
