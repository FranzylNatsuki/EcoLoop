<script setup lang="ts">

const donors = [
  {
    name: 'EcoCorp Global',
    type: 'Primary Partner',
    amount: '$150,000'
  },
  {
    name: 'The Ocean Trust',
    type: 'NGO Foundation',
    amount: '$85,000'
  },
  {
    name: 'Circle Builders',
    type: 'Upcycler Guild',
    amount: '$50,000'
  },
  {
    name: 'Clara Bow',
    type: 'Individual',
    amount: '$25,000'
  },
  {
    name: 'Julian Sterling',
    type: 'Individual',
    amount: '$15,000'
  }
]

</script>

<template>
  <section class="event-side-card">

    <h2>Top Donors</h2>

    <div class="event-divider" />

    <div class="donor-list">

      <div
        v-for="(donor, index) in donors"
        :key="donor.name"
        class="donor-row"
      >

        <div class="rank">
          {{ index + 1 }}
        </div>

        <div class="donor-info">
          <strong>{{ donor.name }}</strong>
          <span>{{ donor.type }}</span>
        </div>

        <strong class="donor-amount">
          {{ donor.amount }}
        </strong>

      </div>

    </div>

  </section>
</template>
