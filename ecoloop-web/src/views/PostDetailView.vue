<script setup lang="ts">
import { ref } from 'vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import posts from '../data/mockPosts.json'
import BackButton from '../components/common/BackButton.vue'

import VotePanel from '../components/posts/VotePanel.vue'
import PostActions from '../components/posts/PostActions.vue'

import DonateMaterialsModal from '../components/Modals/DonateMaterialsModal.vue'


const showDonateModal = ref(false)

interface Post {
	id: string | number
	title: string
	body: string
	image?: string
	votes: number
	comments: number
	category: string
	createdAt: string
	author: {
		name: string
		avatar: string
	}
}

const route = useRoute()

const post = computed<Post | undefined>(() => {
	return posts.find(
		(item) => String(item.id) === String(route.params.id)
	) as Post | undefined
})
</script>

<template>
	<div v-if="post" class="post-detail-page">
		<main class="detail-main">
		    <BackButton />
			<article class="detail-post">

				<!-- Vote Panel -->
				<VotePanel :votes="post.votes" @click.stop/>


				<!-- Post Body -->
				<div class="detail-post-content">

					<!-- Metadata -->
					<div class="detail-post-meta">

						<div class="author-info">
							<img
								:src="post.author.avatar"
								:alt="post.author.name"
								class="detail-avatar"
							/>

							<span>
								Posted by
								<strong>u/{{ post.author.name }}</strong>
							</span>

							<span>•</span>

							<span>{{ post.createdAt }}</span>
						</div>

						<span class="detail-category">
							{{ post.category }}
						</span>

					</div>


					<!-- Title -->
					<h1>
						{{ post.title }}
					</h1>


					<!-- Body -->
					<p class="detail-body">
						{{ post.body }}
					</p>


					<!-- Image -->
					<img
						v-if="post.image"
						:src="post.image"
						:alt="post.title"
						class="detail-image"
					/>

					<!-- Post Actions -->
					<PostActions :comments="post.comments" :hide-comments="true" />
				</div>

			</article>


			<!-- =====================================================
			     MATERIAL DONATIONS
			===================================================== -->

			<section class="detail-card materials-card">

				<div class="section-header">
					<div>
						<h2>Material Donations</h2>
						<p>Help provide the materials needed for this project.</p>
					</div>

					<span class="fulfillment-summary">
						3 of 5 items fulfilled
					</span>
				</div>


				<!-- Glass Bottles -->
				<div class="material-item">

					<div class="material-info">
						<div>
							<strong>Glass Bottles</strong>
							<span>Wine / juice bottles</span>
						</div>

						<span>18 of 25 bottles</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: 72%"
						></div>
					</div>

					<div class="material-footer">
						<span>86 / 120</span>

						<button class="donate-button" @click="showDonateModal = true" >
							Donate
						</button>

						<DonateMaterialsModal v-model="showDonateModal" />
					</div>

				</div>


				<!-- Gravel -->
				<div class="material-item">

					<div class="material-info">
						<div>
							<strong>Gravel / Pebbles</strong>
							<span>Small decorative stones</span>
						</div>

						<span>3 of 5 bags</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: 60%"
						></div>
					</div>

					<div class="material-footer">
						<span>72 / 120</span>

						<button class="donate-button">
							Donate
						</button>
					</div>

				</div>


				<!-- Cotton Twine -->
				<div class="material-item">

					<div class="material-info">
						<div>
							<strong>Cotton Twine</strong>
							<span>Natural cotton wick material</span>
						</div>

						<span>1 of 1 spools</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill fulfilled"
							style="width: 100%"
						></div>
					</div>

					<div class="material-footer">
						<span>Fulfilled</span>

						<button
							class="donate-button fulfilled-button"
							disabled
						>
							Fulfilled
						</button>
					</div>

				</div>


				<!-- Potting Soil -->
				<div class="material-item">

					<div class="material-info">
						<div>
							<strong>Potting Soil</strong>
							<span>General purpose potting mix</span>
						</div>

						<span>2 of 3 bags</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: 67%"
						></div>
					</div>

					<div class="material-footer">
						<span>80 / 120</span>

						<button class="donate-button">
							Donate
						</button>
					</div>

				</div>


				<!-- Herb Seedlings -->
				<div class="material-item">

					<div class="material-info">
						<div>
							<strong>Herb Seedlings</strong>
							<span>Mint, basil, or cilantro</span>
						</div>

						<span>6 of 6 plants</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill fulfilled"
							style="width: 100%"
						></div>
					</div>

					<div class="material-footer">
						<span>Fulfilled</span>

						<button
							class="donate-button fulfilled-button"
							disabled
						>
							Fulfilled
						</button>
					</div>

				</div>

			</section>


			<!-- =====================================================
			     COMMENTS
			===================================================== -->

			<section class="detail-card comments-card">

				<div class="section-header">
					<div>
						<h2>Comments</h2>
						<p>Share your thoughts or experience.</p>
					</div>
				</div>


				<!-- Comment Input -->
				<div class="comment-input-area">

					<textarea
						placeholder="Write a helpful comment or share your experience..."
					></textarea>

					<div class="comment-input-footer">
						<button class="comment-button">
							Comment
						</button>
					</div>

				</div>


				<!-- Comment 1 -->
				<div class="comment">

					<div class="comment-avatar">
						G
					</div>

					<div class="comment-content">

						<div class="comment-meta">
							<strong>green_thumb</strong>
							<span>•</span>
							<span>1 hour ago</span>
						</div>

						<p>
							I have a few cleaned wine bottles that might work
							for this. I'll check what I have available.
						</p>

						<button class="reply-button">
							Reply
						</button>

					</div>

				</div>


				<!-- Comment 2 -->
				<div class="comment">

					<div class="comment-avatar">
						U
					</div>

					<div class="comment-content">

						<div class="comment-meta">
							<strong>urban_composter</strong>
							<span>•</span>
							<span>48 minutes ago</span>
						</div>

						<p>
							For anyone donating bottles, make sure they are
							washed really well first. Removing the labels also
							makes them much easier to reuse.
						</p>

						<button class="reply-button">
							Reply
						</button>

					</div>

				</div>


				<!-- Comment 3 -->
				<div class="comment">

					<div class="comment-avatar">
						E
					</div>

					<div class="comment-content">

						<div class="comment-meta">
							<strong>eco_warrior99</strong>
							<span>•</span>
							<span>22 minutes ago</span>
						</div>

						<p>
							This is a really cool way to reuse old bottles.
							Would love to see the finished planters!
						</p>

						<button class="reply-button">
							Reply
						</button>


						<!-- Nested Reply -->
						<div class="comment nested-comment">

							<div class="comment-avatar author-comment-avatar">
								N
							</div>

							<div class="comment-content">

								<div class="comment-meta">
									<strong>nature_craft</strong>
									<span>•</span>
									<span>10 minutes ago</span>
								</div>

								<p>
									Absolutely! I'll post an update once
									everything is planted.
								</p>

							</div>

						</div>

					</div>

				</div>

			</section>

		</main>


		<!-- =========================================================
		     RIGHT SIDEBAR
		========================================================= -->

		<aside class="detail-sidebar">

			<!-- Author -->
			<section class="sidebar-card author-card">

				<h2>Post Author</h2>

				<div class="author-card-profile">

					<img
						:src="post.author.avatar"
						:alt="post.author.name"
						class="author-card-avatar"
					/>

					<div>
						<strong>u/{{ post.author.name }}</strong>
						<span>14.2k Karma</span>
					</div>

				</div>

				<p>
					Loves turning everyday waste into useful things.
					Sharing practical upcycling projects with the
					community.
				</p>

				<div class="author-stats">

					<div>
						<strong>238</strong>
						<span>Tips Shared</span>
					</div>

					<div>
						<strong>1.2k</strong>
						<span>Upcycles</span>
					</div>

				</div>

				<div class="author-ranking">
					<strong>#1</strong>
					<span>In Upcycling</span>
				</div>

				<div class="joined-date">
					Joined 2024
				</div>

			</section>


			<!-- Community Rules -->
			<section class="sidebar-card">

				<h2>r/GreenCycle Rules</h2>

				<ol class="rules-list">

					<li>
						<strong>1</strong>
						<span>
							Be constructive &amp; positive
						</span>
					</li>

					<li>
						<strong>2</strong>
						<span>
							No greenwashing or ads
						</span>
					</li>

					<li>
						<strong>3</strong>
						<span>
							Accurate waste labels
						</span>
					</li>

				</ol>

			</section>


			<!-- Related Posts -->
			<section class="sidebar-card">

				<h2>Related Posts</h2>

				<a class="related-post">
					<div class="related-votes">
						▲ 182
					</div>

					<div>
						<strong>
							DIY automatic watering system with
							plastic soda bottles
						</strong>

						<span>Upcycling</span>
					</div>
				</a>


				<a class="related-post">
					<div class="related-votes">
						▲ 95
					</div>

					<div>
						<strong>
							Cleaned wine bottle decorative candle
							holders guide
						</strong>

						<span>Upcycling</span>
					</div>
				</a>

			</section>

		</aside>

	</div>


	<!-- =============================================================
	     POST NOT FOUND
	============================================================= -->

	<div v-else class="post-not-found">

		<h1>Post not found</h1>

		<p>
			The post you're looking for doesn't exist.
		</p>

	</div>
</template>


<style scoped>

/* ==========================================================================
   DETAIL PAGE
   ========================================================================== */

.post-detail-page {
	max-width: 1344px;
	margin: 24px auto;

	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	gap: 24px;
}

.detail-main {
	min-width: 0;
}


/* ==========================================================================
   BREADCRUMB
   ========================================================================== */

.breadcrumb {
	display: flex;
	align-items: center;
	gap: 8px;

	margin-bottom: 12px;

	font-size: 13px;
	color: #8f9a8f;

	white-space: nowrap;
	overflow: hidden;
}

.breadcrumb span:last-child {
	overflow: hidden;
	text-overflow: ellipsis;
}

.breadcrumb span:first-child {
	color: #525a52;
	font-weight: 600;
}


/* ==========================================================================
   DETAIL POST
   ========================================================================== */

.detail-post {
	background: #ffffff;

	border: 1px solid #e4e7e3;
	border-radius: 12px;

	display: flex;

	overflow: hidden;

	margin-bottom: 16px;
}

.detail-vote-panel {
	width: 56px;

	flex-shrink: 0;

	background: #fafafa;

	display: flex;
	flex-direction: column;

	align-items: center;
	justify-content: flex-start;

	padding-top: 20px;

	gap: 6px;
}

.detail-post-content {
	flex: 1;
	min-width: 0;

	padding: 20px;
}


/* ==========================================================================
   POST META
   ========================================================================== */

.detail-post-meta {
	display: flex;
	align-items: center;

	gap: 8px;

	margin-bottom: 12px;

	font-size: 12px;

	color: #8f9a8f;
}

.author-info {
	display: flex;
	align-items: center;
	gap: 8px;

	min-width: 0;
}

.author-info strong {
	color: #1a1d1a;
}

.detail-avatar {
	width: 28px;
	height: 28px;

	border-radius: 50%;

	object-fit: cover;

	flex-shrink: 0;
}

.detail-category {
	margin-left: auto;

	padding: 5px 10px;

	border-radius: 999px;

	background: rgba(119, 135, 50, 0.1);

	color: #778732;

	font-family: 'Outfit', sans-serif;

	font-size: 12px;
	font-weight: 600;

	white-space: nowrap;
}


/* ==========================================================================
   TITLE / BODY
   ========================================================================== */

.detail-post-content h1 {
	margin: 0 0 12px;

	font-family: 'Outfit', sans-serif;

	font-size: 24px;
	font-weight: 600;

	line-height: 1.3;

	color: #1a1d1a;
}

.detail-body {
	margin: 0 0 18px;

	color: #525a52;

	font-size: 14px;

	line-height: 1.65;

	white-space: pre-line;
}


/* ==========================================================================
   IMAGE
   ========================================================================== */

.detail-image {
	width: 100%;

	max-height: 420px;

	object-fit: cover;

	display: block;

	border-radius: 10px;
}


/* ==========================================================================
   ACTIONS
   ========================================================================== */

.detail-actions {
	display: flex;
	align-items: center;

	gap: 20px;

	margin-top: 16px;
}

.detail-actions button {
	border: none;
	background: transparent;

	padding: 6px 0;

	color: #6b7280;

	font-size: 13px;

	cursor: pointer;
}

.detail-actions button:hover {
	color: #778732;
}


/* ==========================================================================
   GENERAL CARDS
   ========================================================================== */

.detail-card {
	background: #ffffff;

	border: 1px solid #e4e7e3;
	border-radius: 12px;

	padding: 20px;

	margin-bottom: 16px;
}

.section-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;

	gap: 16px;

	margin-bottom: 18px;
}

.section-header h2 {
	margin: 0 0 4px;

	font-family: 'Outfit', sans-serif;

	font-size: 18px;
	font-weight: 600;

	color: #1a1d1a;
}

.section-header p {
	margin: 0;

	color: #8f9a8f;

	font-size: 13px;
}

.fulfillment-summary {
	color: #778732;

	font-size: 12px;
	font-weight: 600;

	white-space: nowrap;
}


/* ==========================================================================
   MATERIALS
   ========================================================================== */

.material-item {
	padding: 16px 0;

	border-top: 1px solid #e4e7e3;
}

.material-item:first-of-type {
	border-top: none;
}

.material-info {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;

	gap: 16px;

	margin-bottom: 9px;

	font-size: 12px;
	color: #8f9a8f;
}

.material-info > div {
	display: flex;
	flex-direction: column;
	gap: 3px;
}

.material-info strong {
	color: #1a1d1a;
	font-size: 14px;
}

.progress-bar {
	width: 100%;
	height: 7px;

	background: #edf0ec;

	border-radius: 999px;

	overflow: hidden;
}

.progress-fill {
	height: 100%;

	background: #778732;

	border-radius: inherit;
}

.progress-fill.fulfilled {
	background: #9cac62;
}

.material-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;

	margin-top: 8px;

	font-size: 12px;

	color: #8f9a8f;
}

.donate-button {
	border: 1px solid #778732;

	background: transparent;

	color: #778732;

	border-radius: 7px;

	padding: 6px 12px;

	font-size: 12px;
	font-weight: 600;

	cursor: pointer;
}

.donate-button:hover {
	background: rgba(119, 135, 50, 0.08);
}

.fulfilled-button {
	background: #f1f3ee;

	border-color: #dfe4d8;

	color: #8f9a8f;

	cursor: default;
}


/* ==========================================================================
   COMMENTS
   ========================================================================== */

.comment-input-area {
	border: 1px solid #d9dde1;

	border-radius: 9px;

	overflow: hidden;

	margin-bottom: 20px;
}

.comment-input-area textarea {
	width: 100%;

	min-height: 90px;

	padding: 12px;

	border: none;

	outline: none;

	resize: vertical;

	font-family: inherit;

	font-size: 13px;

	color: #1a1d1a;
}

.comment-input-area textarea::placeholder {
	color: #9aa29a;
}

.comment-input-footer {
	display: flex;
	justify-content: flex-end;

	padding: 8px;

	background: #fafafa;

	border-top: 1px solid #e4e7e3;
}

.comment-button {
	border: none;

	background: #778732;

	color: white;

	border-radius: 7px;

	padding: 8px 16px;

	font-size: 12px;
	font-weight: 600;

	cursor: pointer;
}

.comment {
	display: flex;

	gap: 12px;

	padding: 18px 0;

	border-top: 1px solid #e4e7e3;
}

.comment-avatar {
	width: 32px;
	height: 32px;

	flex-shrink: 0;

	border-radius: 50%;

	background: #e8eee4;

	color: #778732;

	display: flex;
	align-items: center;
	justify-content: center;

	font-size: 13px;
	font-weight: 700;
}

.comment-content {
	flex: 1;
	min-width: 0;
}

.comment-meta {
	display: flex;
	align-items: center;

	gap: 7px;

	margin-bottom: 6px;

	font-size: 12px;

	color: #8f9a8f;
}

.comment-meta strong {
	color: #1a1d1a;
}

.comment-content p {
	margin: 0 0 8px;

	color: #525a52;

	font-size: 13px;

	line-height: 1.55;
}

.reply-button {
	border: none;
	background: transparent;

	padding: 0;

	color: #778732;

	font-size: 12px;
	font-weight: 600;

	cursor: pointer;
}

.nested-comment {
	margin-top: 14px;

	padding-top: 14px;
	padding-bottom: 0;

	padding-left: 16px;

	border-left: 2px solid #e4e7e3;
	border-top: none;
}

.author-comment-avatar {
	background: rgba(119, 135, 50, 0.1);
}


/* ==========================================================================
   RIGHT SIDEBAR
   ========================================================================== */

.detail-sidebar {
	display: flex;
	flex-direction: column;

	gap: 16px;
}

.sidebar-card {
	margin: 0;
}

.author-card-profile {
	display: flex;
	align-items: center;

	gap: 10px;

	margin-bottom: 14px;
}

.author-card-profile > div {
	display: flex;
	flex-direction: column;

	gap: 3px;
}

.author-card-profile strong {
	font-family: 'Outfit', sans-serif;

	font-size: 14px;

	color: #1a1d1a;
}

.author-card-profile span {
	font-size: 12px;

	color: #8f9a8f;
}

.author-card-avatar {
	width: 44px;
	height: 44px;

	border-radius: 50%;

	object-fit: cover;
}

.author-card p {
	margin: 0 0 16px;
}

.author-stats {
	display: grid;
	grid-template-columns: 1fr 1fr;

	gap: 8px;

	margin-bottom: 10px;
}

.author-stats div {
	padding: 10px;

	background: #f7f8f6;

	border-radius: 8px;

	display: flex;
	flex-direction: column;

	gap: 2px;
}

.author-stats strong {
	font-family: 'Outfit', sans-serif;

	font-size: 15px;

	color: #1a1d1a;
}

.author-stats span {
	font-size: 11px;

	color: #8f9a8f;
}

.author-ranking {
	display: flex;
	align-items: center;

	gap: 6px;

	padding: 10px;

	background: rgba(119, 135, 50, 0.08);

	border-radius: 8px;

	color: #778732;

	font-size: 12px;
}

.author-ranking strong {
	font-size: 15px;
}

.joined-date {
	margin-top: 12px;

	color: #8f9a8f;

	font-size: 11px;
}


/* ==========================================================================
   RULES
   ========================================================================== */

.rules-list {
	margin: 0;
	padding: 0;

	list-style: none;

	display: flex;
	flex-direction: column;

	gap: 12px;
}

.rules-list li {
	display: flex;
	align-items: flex-start;

	gap: 10px;

	font-size: 13px;

	color: #525a52;
}

.rules-list li strong {
	width: 22px;
	height: 22px;

	flex-shrink: 0;

	display: flex;
	align-items: center;
	justify-content: center;

	background: #f0f3ed;

	border-radius: 50%;

	color: #778732;

	font-size: 11px;
}


/* ==========================================================================
   RELATED POSTS
   ========================================================================== */

.related-post {
	display: flex;

	gap: 10px;

	padding: 12px 0;

	border-top: 1px solid #e4e7e3;

	cursor: pointer;
}

.related-post:first-of-type {
	border-top: none;
}

.related-votes {
	flex-shrink: 0;

	color: #778732;

	font-size: 11px;
	font-weight: 600;
}

.related-post div:last-child {
	display: flex;
	flex-direction: column;

	gap: 5px;
}

.related-post strong {
	font-family: 'Outfit', sans-serif;

	font-size: 13px;

	line-height: 1.35;

	color: #1a1d1a;
}

.related-post span {
	font-size: 11px;

	color: #8f9a8f;
}


/* ==========================================================================
   NOT FOUND
   ========================================================================== */

.post-not-found {
	max-width: 700px;

	margin: 80px auto;

	text-align: center;
}

.post-not-found h1 {
	font-family: 'Outfit', sans-serif;

	color: #1a1d1a;
}

.post-not-found p {
	color: #8f9a8f;
}


/* ==========================================================================
   RESPONSIVE
   ========================================================================== */

@media (max-width: 1100px) {
	.post-detail-page {
		grid-template-columns: minmax(0, 1fr);
		margin: 16px;
	}

	.detail-sidebar {
		display: none;
	}
}

@media (max-width: 750px) {
	.detail-post-content {
		padding: 16px;
	}

	.detail-vote-panel {
		width: 44px;
	}

	.detail-post-content h1 {
		font-size: 20px;
	}

	.detail-post-meta {
		align-items: flex-start;
	}

	.detail-category {
		display: none;
	}

	.section-header {
		flex-direction: column;
	}

	.material-info {
		flex-direction: column;
		gap: 5px;
	}
}

</style>
