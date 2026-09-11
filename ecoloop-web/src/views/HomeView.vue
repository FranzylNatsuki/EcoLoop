<script setup lang="ts">
import PageLayout from '../components/layout/PageLayout.vue'
import CategoryBar from '../components/layout/CategoryBar.vue'
import CreatePostBar from '../components/posts/CreatePostBar.vue'
import PostCard from '../components/posts/PostCard.vue'
import CommunityRules from '../components/sidebar/CommunityRules.vue'
import TrendingTopics from '../components/sidebar/TrendingTopics.vue'
import EventPreview from '../components/sidebar/EventPreview.vue'
import posts from '../data/mockPosts.json'

const currentUserAvatar = 'https://placehold.co/38x38'
</script>

<template>
	<div>
		<CategoryBar />

		<PageLayout>
			<template #main>
				<CreatePostBar :avatar="currentUserAvatar" />
				<PostCard v-for="post in posts" :key="post.id" :post="post" />
			</template>

			<template #sidebar>
				<CommunityRules />
				<TrendingTopics />
				<EventPreview banner="https://placehold.co/247x120" date="Sat, Oct 12"
					title="Community Clean-Up Day"
					description="Join us for a neighborhood clean-up and learn how to sort materials for local recycling centers."
					location="Riverfront Park • 10:00 AM" />
			</template>
		</PageLayout>
	</div>
</template>
