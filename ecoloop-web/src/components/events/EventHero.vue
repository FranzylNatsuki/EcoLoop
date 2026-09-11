<script setup lang="ts">
const countdown = {
  days: '18',
  hours: '04',
  minutes: '42',
  seconds: '19'
}
</script>

<template>
  <section class="event-hero">

    <div class="event-hero-content">

      <div class="event-hero-info">

        <span class="event-badge">
          Featured Global Event
        </span>

        <h1>
          Community Garden Pavilion Build
        </h1>

        <p>
          Help us build a community garden pavilion using reclaimed wood,
          glass bottles, pallets, and repurposed materials. We're collecting
          materials now to start construction.
        </p>

      </div>

      <div class="event-countdown">

        <span class="countdown-title">
          Time Remaining
        </span>

        <div class="countdown-boxes">

          <div class="countdown-box">
            <strong>{{ countdown.days }}</strong>
            <span>DAYS</span>
          </div>

          <div class="countdown-box">
            <strong>{{ countdown.hours }}</strong>
            <span>HRS</span>
          </div>

          <div class="countdown-box">
            <strong>{{ countdown.minutes }}</strong>
            <span>MINS</span>
          </div>

          <div class="countdown-box">
            <strong>{{ countdown.seconds }}</strong>
            <span>SECS</span>
          </div>

        </div>

      </div>

    </div>

  </section>
</template>
