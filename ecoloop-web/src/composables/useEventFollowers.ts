import { ref } from 'vue'
import { supabase } from './useAuth'

export function useEventFollowers() {
  const isUpdating = ref(false)

  // Fast check if user follows a specific event
  const checkIsFollowing = async (eventId: string, userId: string): Promise<boolean> => {
    if (!userId || !eventId) return false
    
    // Using single() will throw an error if no record exists, so maybeSingle is best.
    const { data } = await supabase
      .from('event_followers')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()
      
    return !!data
  }

  // Get total followers for an event
  const getFollowerCount = async (eventId: string): Promise<number> => {
    if (!eventId) return 0
    const { count, error } = await supabase
      .from('event_followers')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      
    if (error) console.error(error)
    return count || 0
  }

  // Toggle Follow Status
  const toggleFollow = async (eventId: string, userId: string, isCurrentlyFollowing: boolean) => {
    isUpdating.value = true
    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('event_followers')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId)
        return false // Now unfollowed
      } else {
        await supabase
          .from('event_followers')
          .insert({ event_id: eventId, user_id: userId })
        return true // Now followed
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      return isCurrentlyFollowing
    } finally {
      isUpdating.value = false
    }
  }

  return {
    isUpdating,
    checkIsFollowing,
    getFollowerCount,
    toggleFollow
  }
}
