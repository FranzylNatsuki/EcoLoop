import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  location?: string
  contactNumber?: string
  isOrg: boolean
  organizationId?: string | null
  avatarUrl?: string
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const API_BASE_URL = 'http://localhost:5167'

  // Fetch profile for the currently logged-in user
  async function fetchProfile() {
    const authStore = useAuthStore()
    if (!authStore.userId || !authStore.token) return

    isLoading.value = true
    error.value = null

    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/${authStore.userId}`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to load profile (${res.status})`)
      }

      profile.value = await res.json()
    } catch (err: any) {
      error.value = err.message || 'Error fetching profile'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  // Update profile data (e.g., location, contact info)
  async function updateProfile(updatedData: Partial<UserProfile>) {
    const authStore = useAuthStore()
    if (!authStore.userId || !authStore.token) return

    isLoading.value = true
    error.value = null

    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/${authStore.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!res.ok) {
        throw new Error(`Failed to update profile (${res.status})`)
      }

      // Update local state reactively
      if (profile.value) {
        profile.value = { ...profile.value, ...updatedData }
      }
    } catch (err: any) {
      error.value = err.message || 'Error updating profile'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  // Clear profile data on logout
  function clearProfile() {
    profile.value = null
    error.value = null
  }

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    clearProfile,
  }
})
