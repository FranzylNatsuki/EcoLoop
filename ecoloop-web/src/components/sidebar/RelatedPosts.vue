<script setup lang="ts">
export interface RelatedPost {
  id: string | number
  title: string
  votes: number
  category: string
}

defineProps<{ posts: RelatedPost[] }>()
</script>

<template>
  <section class="sidebar-card">
    <h2>Related Posts</h2>
    <a v-for="item in posts" :key="item.id" class="related-post">
      <div class="related-votes">▲ {{ item.votes }}</div>
      <div>
        <strong>{{ item.title }}</strong>
        <span>{{ item.category }}</span>
      </div>
    </a>
  </section>
</template>

<style scoped>
.sidebar-card { background: #ffffff; border: 1px solid #e4e7e3; border-radius: 12px; padding: 20px; }
.sidebar-card h2 { margin: 0 0 14px; font-family: 'Outfit', sans-serif; font-size: 16px; color: #1a1d1a; }
.related-post { display: flex; gap: 10px; padding: 12px 0; border-top: 1px solid #e4e7e3; cursor: pointer; text-decoration: none; }
.related-post:first-of-type { border-top: none; }
.related-votes { flex-shrink: 0; color: #778732; font-size: 11px; font-weight: 600; }
.related-post div:last-child { display: flex; flex-direction: column; gap: 5px; }
.related-post strong { font-family: 'Outfit', sans-serif; font-size: 13px; line-height: 1.35; color: #1a1d1a; }
.related-post span { font-size: 11px; color: #8f9a8f; }
</style>
