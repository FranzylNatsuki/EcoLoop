<script setup lang="ts">
import { useRouter} from 'vue-router'
import { computed, onMounted, ref } from 'vue'
// import VotePanel from './VotePanel.vue'
import PostActions from './PostActions.vue'
import { supabase } from '../../composables/useAuth'

interface PostImage {
  image_url: string
  display_order: number
}

interface Post {
  id: string | number
  title: string
  body: string
  post_images?: PostImage[]
  vote_count: number
  comment_count: number
  category: string
  created_at: string
  is_completed: boolean // <-- Added completion state
  author_id?: string
  author: {
    id?: string;
    full_name: string;
    Avatar: string
  }
}

const props = defineProps<{ post: Post }>()
const router = useRouter()

const myId = ref<string | null>(null)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) {
    myId.value = session.user.id
  }
})

const isOwner = computed(() => {
  const postAuthorId = props.post.author_id || props.post.author?.id
  if (!myId.value || !postAuthorId) return false
  return myId.value === postAuthorId
})

const coverImage = computed(() => {
  if (props.post.post_images && props.post.post_images.length > 0) {
    const sortedImages = [...props.post.post_images].sort((a, b) => a.display_order - b.display_order)
    return sortedImages[0].image_url
  }
  return null
})

const extraImagesCount = computed(() => {
  if (props.post.post_images && props.post.post_images.length > 1) {
    return props.post.post_images.length - 1
  }
  return 0
})

function openPost() {
  router.push(`/post/${props.post.id}`)
}
</script>

<template>
  <article class="post-card" :class="{ 'is-completed': post.is_completed }" @click="openPost">
    <!-- <VotePanel :votes="post.vote_count" @click.stop /> -->

    <div class="post-content">
      <div class="post-meta">
        <img :src="post.author.Avatar" :alt="post.author.full_name" class="avatar" />
        <span class="author-name">{{ post.author.full_name }}</span>
        <span class="meta-dot">•</span>
        <span class="time-ago">{{ new Date(post.created_at).toLocaleDateString() }}</span>

        <!-- Updated: Switch between Category and Completed Badge -->
        <span v-if="post.is_completed" class="completed-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Completed
        </span>
        <span v-else class="category">{{ post.category }}</span>
      </div>

      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>

      <div v-if="coverImage" class="image-container">
        <img :src="coverImage" :alt="post.title" class="post-image" />
        <div v-if="extraImagesCount > 0" class="more-images-badge">
          +{{ extraImagesCount }}
        </div>
      </div>

      <!-- Passed is-completed prop down to PostActions -->
      <PostActions
              :votes="post.vote_count"
              :comments="post.comment_count"
              :post-id="post.id"
              :is-owner="isOwner"
              :is-completed="post.is_completed"
              :project-name="post.title"
              :author-username="post.author.full_name"
            />
    </div>
  </article>
</template>

<style scoped>
.post-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  display: flex;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
}

.post-card:hover {
  border-color: #cfd6cc;
  box-shadow: 0 2px 8px rgba(31, 41, 33, 0.06);
}

/* Optional: slightly dim completed posts */
.post-card.is-completed {
  background: #fcfdfc;
}
.post-card.is-completed h2,
.post-card.is-completed p {
  opacity: 0.7;
}

.post-content {
  flex: 1;
  min-width: 0;
  padding: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #525a52;
  margin-bottom: 8px;
}

.post-meta .avatar,
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-name {
  font-weight: 600;
  color: #1a1d1a;
}

.meta-dot {
  color: #8f9a8f;
}

.category {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(119, 135, 50, 0.1);
  color: #778732;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
}

/* New badge for completed posts */
.completed-badge {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  background: #e4e7e3;
  color: #525a52;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content h2 {
  margin: 0 0 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  color: #1a1d1a;
}

.post-content p {
  margin: 0 0 16px;
  color: #525a52;
  font-size: 14px;
  line-height: 1.5;
}

.image-container {
  position: relative;
}

.post-image {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin-bottom: 12px;
}

.more-images-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(26, 29, 26, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
</style>
