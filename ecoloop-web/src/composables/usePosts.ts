import { ref, onMounted } from 'vue'

export interface Author {
  name: string
  avatar: string
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
  id: number
  title: string
  body: string
  image?: string
  votes: number
  comments: number
  category: string
  createdAt: string
  author: Author
  eventDetails?: EventDetails
  materials?: MaterialItem[]
}

export interface CreatePostPayload {
  category: string
  title: string
  description: string
  images: string[]
  eventDetails?: EventDetails
  materials?: MaterialItem[]
}

const posts = ref<Post[]>([])

export function usePosts() {
  const API_URL = 'http://localhost:3001/posts'

  async function fetchPosts() {
    try {
      const res = await fetch(API_URL)
      posts.value = await res.json()
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  async function addPost(newPostData: CreatePostPayload) {
    const newPost: Omit<Post, 'id'> = {
      title: newPostData.title,
      body: newPostData.description,
      image: newPostData.images[0] || 'https://placehold.co/617x320',
      votes: 1,
      comments: 0,
      category: newPostData.category,
      createdAt: 'Just now',
      author: {
        name: 'FranzyllTheory',
        avatar: 'https://placehold.co/24x24'
      },
      ...(newPostData.eventDetails && { eventDetails: newPostData.eventDetails }),
      ...(newPostData.materials && { materials: newPostData.materials })
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      })
      const createdPost = await res.json()
      posts.value.unshift(createdPost)
    } catch (err) {
      console.error('Error saving post to json-server:', err)
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
