<script setup lang="ts">
import { MapPin, Calendar } from 'lucide-vue-next'

defineProps<{
	banner: string
	date: string
	title: string
	description: string
	location: string
}>()
</script>

<template>
	<div class="sidebar-card event-card">
		<!-- Banner Image with Date Badge Overlay -->
		<div class="banner-wrapper">
			<img class="event-banner" :src="banner" :alt="title" />
			<div class="date-badge">
				<Calendar :size="12" />
				<span>{{ date }}</span>
			</div>
		</div>

		<!-- Card Content Body -->
		<div class="event-content">
			<span class="section-label">Upcoming Event</span>
			<h3 class="event-title">{{ title }}</h3>
			<p class="event-description">{{ description }}</p>

			<div class="event-footer">
				<div class="event-meta">
					<MapPin :size="14" class="pin-icon" />
					<span class="location-text">{{ location }}</span>
				</div>
				<button class="join-btn">View Event</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* ==========================================================================
   EVENT CARD CONTAINER
   ========================================================================== */
.event-card {
	background: #ffffff;
	border: 1px solid #e4e7e3;
	border-radius: 16px;
	overflow: hidden;
	width: 100%;
	box-sizing: border-box;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.event-card:hover {
	border-color: #cbd2c8;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* ==========================================================================
   BANNER & OVERLAY
   ========================================================================== */
.banner-wrapper {
	position: relative;
	width: 100%;
	height: 120px;
	overflow: hidden;
	background: #f7f8f6;
}

.event-banner {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}

.date-badge {
	position: absolute;
	top: 10px;
	right: 10px;
	background: rgba(26, 29, 26, 0.75);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	color: #ffffff;
	font-family: 'Outfit', sans-serif;
	font-size: 11px;
	font-weight: 600;
	padding: 4px 10px;
	border-radius: 20px;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	letter-spacing: 0.2px;
}

/* ==========================================================================
   CONTENT BODY
   ========================================================================== */
.event-content {
	padding: 16px;
	display: flex;
	flex-direction: column;
}

.section-label {
	font-family: 'Outfit', sans-serif;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #778732;
	margin-bottom: 6px;
}

.event-title {
	margin: 0 0 6px 0;
	font-family: 'Outfit', sans-serif;
	font-size: 16px;
	font-weight: 700;
	line-height: 1.3;
	color: #1a1d1a;
}

.event-description {
	margin: 0 0 16px 0;
	font-size: 13px;
	line-height: 1.45;
	color: #525a52;

	/* Line Clamp with Fallbacks for Full Compatibility */
	display: -webkit-box;
	display: -moz-box;
	display: box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	-moz-box-orient: vertical;
	box-orient: vertical;
	overflow: hidden;
}

/* ==========================================================================
   FOOTER & LOCATION
   ========================================================================== */
.event-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 12px;
	border-top: 1px solid #f0f2ef;
	gap: 12px;
}

.event-meta {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.pin-icon {
	color: #86a2b1;
	flex-shrink: 0;
}

.location-text {
	font-size: 12px;
	font-weight: 500;
	color: #8f9a8f;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.join-btn {
	background: #f7f8f6;
	border: 1px solid #e4e7e3;
	border-radius: 8px;
	padding: 6px 12px;
	font-family: 'Outfit', sans-serif;
	font-size: 12px;
	font-weight: 600;
	color: #1a1d1a;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s ease;
}

.join-btn:hover {
	background: #778732;
	color: #ffffff;
	border-color: #778732;
}
</style>
