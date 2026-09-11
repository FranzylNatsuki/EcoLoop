<template>
	<RouterLink to="/events" class="see-events-button">
		See Events
	</RouterLink>
</template>

<style scoped>
.see-events-button {
	padding: 10px 18px;
	background: #ffffff;
	border: 1px solid #778732;
	border-radius: 20px;
	color: #778732;
	font-size: 14px;
	font-family: 'Outfit', sans-serif;
	font-weight: 600;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
}

.see-events-button:hover {
	background: #778732;
	color: #ffffff;
}
</style>
