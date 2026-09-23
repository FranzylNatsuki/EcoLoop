import { ref, onMounted } from 'vue'
import { supabase } from './useAuth' // Assuming this is where you initialized Supabase

// 1. Updated Interfaces to match Supabase schema
export interface Author {
  full_name: string
  Avatar: string
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
}

export interface CreatePostPayload {
  category: string
  title: string
  description: string
  images: string[] // Array of URLs (uploaded to Supabase Storage prior to this)
  eventDetails?: EventDetails
  materials?: MaterialItem[]
}

const posts = ref<Post[]>([])

export function usePosts() {
  // 2. Fetch Posts using Supabase relational joins
  async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('cause_requests')
          .select(`
            *,
            author:profiles!author_id (
              full_name,
              profile_data ( Avatar )
            ),
            post_images ( image_url, display_order )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Flatten the nested Avatar data so it matches the Post interface
        posts.value = data.map((post: any) => ({
                  ...post,
                  is_completed: post.is_completed || false, // <-- 2. ADD THIS FALLBACK
                  author: {
                    full_name: post.author?.full_name || 'Unknown User',
                    Avatar: post.author?.profile_data?.Avatar || 'https://placehold.co/38x38'
                  }
                })) as Post[]
      } catch (err) {
        console.error('Error fetching posts from Supabase:', err)
      }
    }

  // 3. Add Post using Supabase Auth & Multi-table Insert
  async function addPost(newPostData: CreatePostPayload) {
    try {
      // Step A: Get the authenticated user's ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("Unauthorized: Must be logged in to post.")
        return
      }

      const userId = session.user.id

      // Step B: Insert the main post into `cause_requests`
      const { data: insertedPost, error: postError } = await supabase
        .from('cause_requests')
        .insert({
          author_id: userId,
          title: newPostData.title,
          body: newPostData.description,
          category: newPostData.category,
          // If you add JSONB columns to your DB, uncomment these:
          // event_details: newPostData.eventDetails,
          // materials: newPostData.materials
        })
        .select()
        .single() // Returns the exact row created, so we have the new ID

      if (postError) throw postError

      // Step C: If there are images, insert them into `post_images`
      if (newPostData.images && newPostData.images.length > 0) {
        // Map the array of strings into array of objects for Supabase
        const imageInserts = newPostData.images.map((url, index) => ({
          post_id: insertedPost.id,
          image_url: url,
          display_order: index // Keeps the order they uploaded them
        }))

        const { error: imageError } = await supabase
          .from('post_images')
          .insert(imageInserts)

        if (imageError) throw imageError
      }

      // Step D: Refresh the local list to show the new post instantly
      await fetchPosts()

    } catch (err) {
      console.error('Error saving post to Supabase:', err)
    }
  }

  onMounted(() => {
    if (posts.value.length === 0) {
      fetchPosts()
    }
  })

  return {
    posts,
    addPost,
    fetchPosts
  }
}
