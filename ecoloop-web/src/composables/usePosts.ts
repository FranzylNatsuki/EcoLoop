import { ref } from 'vue'
import { supabase } from './useAuth'

export interface Author {
  full_name: string
  Avatar: string
  score?: number
  is_org?: boolean
  is_verified?: boolean
}

export interface PostImage {
  image_url: string
  display_order: number
}

export interface MaterialItem {
  id: string | number
  name: string
  quantity: number | string
  unit: string
  description: string
}

export interface EventDetails {
  date: string
  time: string
  location: string
}

export interface Post {
  id: string
  title: string
  body: string
  category: string
  vote_count: number
  comment_count: number
  status: string
  created_at: string
  is_completed: boolean
  author: Author
  author_id: string
  post_images?: PostImage[]
  eventDetails?: EventDetails
  materials?: MaterialItem[]
  latitude?: number | null
  longitude?: number | null
  location_address?: string
}

export interface CreatePostPayload {
  category: string
  title: string
  description: string
  images: string[]
  eventDetails?: EventDetails
  materials?: MaterialItem[]
  latitude?: number | null
  longitude?: number | null
  location_address?: string
}

const posts = ref<Post[]>([])

export function usePosts() {
  async function fetchPosts(searchQuery?: string, limit: number = 20) {
    try {
      let query = supabase
        .from('cause_requests')
        .select(`
          id, title, body, category, vote_count, comment_count, is_completed, created_at, author_id, latitude, longitude, location_address,
          author:profiles!author_id (
            full_name,
            is_org,
            organization_id,
            profile_data ( Avatar ),
            organizations!organization_id ( verification_status )
          ),
          post_images ( image_url, display_order )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (searchQuery && searchQuery.trim().length > 0) {
        const terms = searchQuery.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)

        if (terms.length > 0 && terms[0] !== '') {
          const formattedQuery = terms.join(' & ') + ':*'

          query = query.textSearch('fts', formattedQuery, {
            config: 'english'
          })
        }
      }

      const { data, error } = await query

      if (error) throw error

      posts.value = data.map((post: any) => {
        const rawAuthor = Array.isArray(post.author) ? post.author[0] : post.author
        let isVerified = false
        if (rawAuthor?.is_org && rawAuthor?.organizations) {
          const org = Array.isArray(rawAuthor.organizations) ? rawAuthor.organizations[0] : rawAuthor.organizations
          if (org?.verification_status === 'verified') isVerified = true
        }

        return {
          ...post,
          is_completed: post.is_completed || false,
          author: {
            full_name: rawAuthor?.full_name || 'Unknown User',
            Avatar: rawAuthor?.profile_data?.Avatar || 'https://placehold.co/38x38',
            is_org: Boolean(rawAuthor?.is_org),
            is_verified: isVerified
          }
        }
      }) as Post[]
    } catch (err) {
      console.error('Error fetching posts from Supabase:', err)
    }
  }

  async function addPost(newPostData: CreatePostPayload) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("Unauthorized: Must be logged in to post.")
        return
      }

      const userId = session.user.id

      const { data: insertedPost, error: postError } = await supabase
        .from('cause_requests')
        .insert({
          author_id: userId,
          title: newPostData.title,
          body: newPostData.description,
          category: newPostData.category,
          latitude: newPostData.latitude ?? null,
          longitude: newPostData.longitude ?? null,
          location_address: newPostData.location_address ?? null,
        })
        .select()
        .single()

      if (postError) throw postError

      if (newPostData.images && newPostData.images.length > 0) {
        const imageInserts = newPostData.images.map((url, index) => ({
          post_id: insertedPost.id,
          image_url: url,
          display_order: index
        }))

        const { error: imageError } = await supabase
          .from('post_images')
          .insert(imageInserts)

        if (imageError) throw imageError
      }

      await fetchPosts()

    } catch (err) {
      console.error('Error saving post to Supabase:', err)
    }
  }

  return {
    posts,
    addPost,
    fetchPosts
  }
}
