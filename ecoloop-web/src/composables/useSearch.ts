import { ref } from 'vue'
import { supabase } from './useAuth'

export interface SearchSuggestion {
  id: string
  title: string
  type: 'post' | 'event' | 'user'
  avatar?: string
}

const searchInput = ref('')
const debouncedSearchQuery = ref('')
const suggestions = ref<SearchSuggestion[]>([])
const showSuggestions = ref(false)

let debounceTimeout: ReturnType<typeof setTimeout>

export function useSearch() {
  async function fetchSuggestions(query: string) {
    if (!query.trim()) {
      suggestions.value = []
      return
    }

    // Prepare search terms for Full Text Search (Posts & Events)
    const terms = query.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)
    if (terms.length === 0 || terms[0] === '') return
    const formattedQuery = terms.join(' & ') + ':*'

    // Fetch Posts, Events, and Users simultaneously
    const [postsRes, eventsRes, usersRes] = await Promise.all([
      supabase
        .from('cause_requests')
        .select('id, title')
        .textSearch('fts', formattedQuery, { config: 'english' })
        .limit(3),
      supabase
        .from('events')
        .select('id, title')
        .textSearch('fts', formattedQuery, { config: 'english' })
        .limit(3),
      supabase
        .from('profiles')
        .select('id, full_name, location, profile_data(Avatar)')
        .or(`full_name.ilike.%${query.trim()}%,location.ilike.%${query.trim()}%`)
        .limit(3)
    ])

    // DEBUG: Log any database errors directly to your browser console
    if (usersRes.error) console.error("Users Search DB Error:", usersRes.error.message)
    if (postsRes.error) console.error("Posts Search DB Error:", postsRes.error.message)
    if (eventsRes.error) console.error("Events Search DB Error:", eventsRes.error.message)

    const combined: SearchSuggestion[] = []

    // 1. Map Users (so they appear at the top of the dropdown)
    if (usersRes.data) {
      combined.push(...usersRes.data.map((u: any) => {
        const profileData = Array.isArray(u.profile_data) ? u.profile_data[0] : u.profile_data
        return {
          id: u.id,
          title: u.full_name,
          type: 'user' as const,
          avatar: profileData?.Avatar || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
        }
      }))
    }

    // 2. Map Posts
    if (postsRes.data) {
      combined.push(...postsRes.data.map(p => ({ id: p.id, title: p.title, type: 'post' as const })))
    }

    // 3. Map Events
    if (eventsRes.data) {
      combined.push(...eventsRes.data.map(e => ({ id: e.id, title: e.title, type: 'event' as const })))
    }

    suggestions.value = combined
  }

  function updateSearch(value: string) {
    searchInput.value = value
    showSuggestions.value = true

    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      debouncedSearchQuery.value = value
      fetchSuggestions(value)
    }, 300)
  }

  function clearSearch() {
    searchInput.value = ''
    debouncedSearchQuery.value = ''
    suggestions.value = []
    showSuggestions.value = false
  }

  return {
    searchInput,
    debouncedSearchQuery,
    suggestions,
    showSuggestions,
    updateSearch,
    clearSearch
  }
}
