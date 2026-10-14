import { ref } from 'vue'
import { supabase } from './useAuth'

export interface UserCoordinates {
  lat: number
  lng: number
}

// Module-level reactive state shared across all components and views
const userLocation = ref<UserCoordinates | null>(null)
const isFetchingLocation = ref(false)

// Dumaguete default fallback coordinates
export const DUMAGUETE_COORDINATES: UserCoordinates = { lat: 9.3068, lng: 123.3054 }

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getItemDistance(item: any): number {
  if (!userLocation.value) return Number(item?.distance) || Infinity
  const target = item?.item || item
  const lat = target?.latitude ?? target?.lat
  const lng = target?.longitude ?? target?.lng ?? target?.lon
  if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return calculateDistance(userLocation.value.lat, userLocation.value.lng, Number(lat), Number(lng))
  }
  return Number(target?.distance) || Infinity
}

export function setUserLocation(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    userLocation.value = { lat: Number(lat), lng: Number(lng) }
  }
}

export function useUserLocation() {
  async function fetchUserLocation(forceRefresh = false): Promise<UserCoordinates> {
    if (userLocation.value && !forceRefresh) {
      return userLocation.value
    }

    if (isFetchingLocation.value) {
      return userLocation.value || DUMAGUETE_COORDINATES
    }

    isFetchingLocation.value = true

    try {
      // 1. Prioritize logged-in user's profile location
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', session.user.id)
          .maybeSingle()

        if (
          profile &&
          profile.latitude != null &&
          profile.longitude != null &&
          !isNaN(Number(profile.latitude)) &&
          !isNaN(Number(profile.longitude))
        ) {
          userLocation.value = {
            lat: Number(profile.latitude),
            lng: Number(profile.longitude)
          }
          return userLocation.value
        }
      }

      // 2. Fallback to browser geolocation
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000
            })
          })
          userLocation.value = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
          return userLocation.value
        } catch {
          // Geolocation was denied or timed out
        }
      }

      // 3. Fallback to default
      userLocation.value = DUMAGUETE_COORDINATES
      return userLocation.value
    } catch (err) {
      console.warn('[useUserLocation] Error fetching user location, using default:', err)
      userLocation.value = DUMAGUETE_COORDINATES
      return userLocation.value
    } finally {
      isFetchingLocation.value = false
    }
  }

  return {
    userLocation,
    fetchUserLocation,
    setUserLocation,
    calculateDistance,
    getItemDistance
  }
}
