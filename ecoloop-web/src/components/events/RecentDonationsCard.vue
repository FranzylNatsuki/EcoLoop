<script setup lang="ts">

const donations = [
  {
    name: 'Sarah Jenkins',
    amount: '12 wood planks',
    time: '2m ago',
    message: 'Perfect for the frame and shelving. Thanks!'
  },
  {
    name: 'Robert Thorne',
    amount: '30 glass bottles',
    time: '12m ago',
    message: 'These will look great in the bottle wall.'
  },
  {
    name: 'Elena Rostova',
    amount: '8 pallets',
    time: '1h ago',
    message: 'Exactly what we needed for the decking.'
  },
  {
    name: 'Marcus Brody',
    amount: '2 metal pipes',
    time: '3h ago',
    message: 'Perfect for the irrigation supports.'
  }
]

</script>

<template>
  <section class="event-card">

    <div class="card-heading">
      <h2>Recent Donations</h2>
      <button>View All</button>
    </div>

    <div class="event-divider" />

    <div class="donations-list">

      <div
        v-for="donation in donations"
        :key="donation.name"
        class="donation"
      >

        <img
          src="https://placehold.co/40x40"
          :alt="donation.name"
        />

        <div class="donation-content">

          <div class="donation-header">
            <div>
              <strong>{{ donation.name }}</strong>
              <span>{{ donation.amount }}</span>
            </div>

            <small>{{ donation.time }}</small>
          </div>

          <p>{{ donation.message }}</p>

        </div>

      </div>

    </div>

  </section>
</template>
