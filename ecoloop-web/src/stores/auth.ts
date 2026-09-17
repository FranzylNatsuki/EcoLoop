import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const userId = ref<string | null>(localStorage.getItem('userId'))

  // Check if user is logged in
  const isAuthenticated = computed(() => !!token.value)

  // Save session when user logs in or registers
  function setSession(accessToken: string, refreshToken: string, id: string) {
    token.value = accessToken
    userId.value = id

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('userId', id)
  }

  // Clear session on logout
  function logout() {
    token.value = null
    userId.value = null

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
  }

  return {
    token,
    userId,
    isAuthenticated,
    setSession,
    logout,
  }
})
