<script setup lang="ts">

const events = [
  {
    category: 'E-Waste',
    date: 'April 18, 2026',
    title: 'Municipal E-Waste Recycling Drive',
    description: 'Over 1,200 lbs collected so far'
  },
  {
    category: 'Composting',
    date: 'May 2, 2026',
    title: 'Composting Tumbler Masterclass',
    description: 'Learn terms & optimal thermal curing'
  }
]

</script>

<template>
  <section class="event-side-card">

    <h2>Related Events</h2>

    <div class="event-divider" />

    <div class="related-events">

      <article
        v-for="event in events"
        :key="event.title"
        class="related-event"
      >

        <div class="related-event-meta">

          <span class="event-category">
            {{ event.category }}
          </span>

          <span>
            {{ event.date }}
          </span>

        </div>

        <strong>
          {{ event.title }}
        </strong>

        <p>
          {{ event.description }}
        </p>

      </article>

    </div>

  </section>
</template>
