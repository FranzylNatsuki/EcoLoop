<script setup lang="ts">
const tags = [
	'#KitchenCompost', '#ZeroWasteKitchen', '#TechRestoration',
	'#BackyardPermaculture', '#DIYRepurposing', '#CardboardUpcycling', '#PlasticBans2026',
]
</script>

<template>
	<div class="sidebar-card">
		<h2>Trending Topics</h2>
		<div class="divider" />

		<div class="tag-cloud">
			<span v-for="tag in tags" :key="tag" class="trend-tag">{{ tag }}</span>
		</div>
	</div>
</template>

<style scoped>
.sidebar-card {
  background: #ffffff;
  border: 1px solid #e4e7e3;
  border-radius: 12px;
  padding: 18px;
  /* Ensures the card itself doesn't overflow its parent grid column */
  width: 100%;
  box-sizing: border-box;
}

.sidebar-card h2 {
  margin: 0 0 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1a1d1a;
}

.divider {
  height: 1px;
  background: #e4e7e3;
  margin-bottom: 14px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap; /* Allows tags to flow to the next line */
  gap: 8px;
  width: 100%;
}

.trend-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #f7f8f6;
  border: 1px solid #e4e7e3;
  border-radius: 16px;
  font-size: 13px;
  color: #525a52;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Key fixes for extra-long single words/hashtags */
  max-width: 100%;          /* Prevents any single tag from exceeding the container width */
  overflow-wrap: anywhere;  /* Forces long words to break if they exceed card width */
  word-break: break-word;   /* Fallback for older browsers */
}

.trend-tag:hover {
  background: rgba(119, 135, 50, 0.1);
  color: #778732;
  border-color: #778732;
}
</style>
