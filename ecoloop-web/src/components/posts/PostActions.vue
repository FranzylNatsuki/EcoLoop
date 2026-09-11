<script setup lang="ts">
import { MessageCircle, Share2, Bookmark, MapPin } from 'lucide-vue-next'

defineProps<{ comments: number }>()
defineEmits<{ share: []; save: []; donate: []; map: [] }>()
</script>

<template>
	<div class="post-footer">
		<div class="actions-left">
			<button class="footer-action">
				<MessageCircle :size="14" />
				<span>{{ comments }} Comments</span>
			</button>

			<button class="footer-action" @click="$emit('share')">
				<Share2 :size="14" />
				<span>Share</span>
			</button>

			<button class="footer-action" @click="$emit('save')">
				<Bookmark :size="14" />
				<span>Save</span>
			</button>

			<button class="footer-action" @click="$emit('map')">
				<MapPin :size="14" />
				<span>Map</span>
			</button>
		</div>

		<button class="btn-donate" @click="$emit('donate')">
			Donate
		</button>
	</div>
</template>

<style scoped>
/* ==========================================================================
   POST FOOTER CONTAINER
   ========================================================================== */
.post-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding-top: 16px;
	margin-top: 16px;
	border-top: 1px solid #f0f2ef;
	gap: 12px;
	box-sizing: border-box;
}

/* ==========================================================================
   LEFT ACTIONS GROUP
   ========================================================================== */
.actions-left {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.footer-action {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	background: #f7f8f6;
	border: 1px solid transparent;
	border-radius: 6px;
	color: #525a52;
	font-family: 'Outfit', sans-serif;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.footer-action:hover {
	background: #e4e7e3;
	color: #1a1d1a;
}

/* ==========================================================================
   DONATE BUTTON (FIGMA MATCH)
   ========================================================================== */
.btn-donate {
	height: 32px;
	padding: 0 50px;
	background: #617024;
	border: none;
	border-radius: 8px;
	color: #ffffff;
	font-family: 'Outfit', sans-serif;
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	white-space: nowrap;
	transition: background-color 0.2s ease;
}

.btn-donate:hover {
	background: #4f5b1d;
}
</style>
