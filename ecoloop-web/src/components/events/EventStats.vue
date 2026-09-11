<script setup lang="ts">

const stats = [
  {
    value: '847',
    label: 'Materials donated',
    icon: '📦'
  },
  {
    value: '12',
    label: 'Active builders on site',
    icon: '📍'
  },
  {
    value: '3',
    label: 'Completed builds',
    icon: '👥'
  },
  {
    value: '156',
    label: 'Donors & volunteers',
    icon: '🌐'
  }
]

</script>

<template>
  <section class="event-stats">

    <div
      v-for="stat in stats"
      :key="stat.label"
      class="stat-card"
    >
      <div class="stat-icon">
        {{ stat.icon }}
      </div>

      <strong>{{ stat.value }}</strong>

      <span>{{ stat.label }}</span>
    </div>

  </section>
</template>
