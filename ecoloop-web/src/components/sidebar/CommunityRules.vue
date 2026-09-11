<script setup lang="ts">
const rules = [
	{ title: 'Be constructive & positive', description: 'We are here to support zero-waste journeys, not shame beginners.' },
	{ title: 'No greenwashing or corporate ads', description: 'Genuine sustainable projects only. Shills will be recycled.' },
	{ title: 'Accurate waste labels', description: 'Tag your posts correctly (Composting, E-Waste, Upcycling).' },
]
</script>

<template>
	<div class="sidebar-card">
		<h2 class="card-title">Community Rules</h2>
		<div class="divider" />

		<ol class="rules-list">
			<li v-for="(rule, index) in rules" :key="rule.title" class="rule-item">
				<span class="rule-number">{{ index + 1 }}</span>
				<div class="rule-body">
					<p class="rule-title">{{ rule.title }}</p>
					<p class="rule-description">{{ rule.description }}</p>
				</div>
			</li>
		</ol>
	</div>
</template>

<style scoped>
/* ==========================================================================
   CARD CONTAINER
   ========================================================================== */
.sidebar-card {
	background: #ffffff;
	border: 1px solid #e4e7e3;
	border-radius: 16px;
	padding: 20px;
	width: 100%;
	box-sizing: border-box;
}

.card-title {
	margin: 0 0 12px 0;
	font-family: 'Outfit', sans-serif;
	font-size: 16px;
	font-weight: 700;
	color: #1a1d1a;
}

.divider {
	height: 1px;
	background: #e4e7e3;
	margin-bottom: 16px;
}

/* ==========================================================================
   RULES LIST & NUMBER ALIGNMENT FIX
   ========================================================================== */
.rules-list {
	list-style: none; /* Removes browser default numbers */
	margin: 0;
	padding: 0;      /* Removes browser default OL indentation */
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.rule-item {
	display: flex;
	align-items: flex-start; /* Aligns badge top with text top */
	gap: 12px;
}

.rule-number {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: #f7f8f6;
	border: 1px solid #e4e7e3;
	color: #778732;
	font-family: 'Outfit', sans-serif;
	font-size: 12px;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;  /* Stops the badge from squeezing on long text */
	margin-top: 1px;  /* Optical vertical baseline fix with title */
}

/* ==========================================================================
   RULE TEXT BODY
   ========================================================================== */
.rule-body {
	flex: 1;
	min-width: 0;
}

.rule-title {
	margin: 0 0 2px 0;
	font-family: 'Outfit', sans-serif;
	font-size: 14px;
	font-weight: 600;
	line-height: 1.35;
	color: #1a1d1a;
}

.rule-description {
	margin: 0;
	font-size: 12px;
	line-height: 1.45;
	color: #525a52;

	/* Multi-browser Line Clamp */
	display: -webkit-box;
	display: -moz-box;
	display: box;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	-webkit-box-orient: vertical;
	-moz-box-orient: vertical;
	box-orient: vertical;
	overflow: hidden;
}
</style>
