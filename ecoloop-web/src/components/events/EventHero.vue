<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { EventItem } from '../../types/event'

const props = defineProps<{
  event: EventItem
}>()

const now = ref(Date.now())
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timerInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const countdown = computed(() => {
  if (!props.event?.schedule) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00' }
  }

  const target = new Date(props.event.schedule).getTime()
  const diff = Math.max(0, target - now.value)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  }
})

const heroStyle = computed(() => {
  const bgImage = props.event?.image || 'https://placehold.co/1200x600/1e293b/ffffff?text=Event+Banner'

  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.75)), url('${bgImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})
</script>

<template>
  <section class="event-hero" :style="heroStyle">
    <div class="event-hero-content">
      <div class="event-hero-info">
        <span class="event-badge">
          {{ event.category || 'Featured Global Event' }}
        </span>

        <h1>{{ event.event_title }}</h1>
        <p>{{ event.description }}</p>
      </div>

      <div class="event-countdown">
        <span class="countdown-title">Time Remaining</span>

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

<style scoped>
.event-hero {
  border-radius: 16px;
  padding: 64px 48px;
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  color: #ffffff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
}

.event-hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  width: 100%;
}

.event-hero-info {
  max-width: 680px;
}

.event-badge {
  display: inline-block;
  background: #ca8a04;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.event-hero-info h1 {
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 16px 0;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.event-hero-info p {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #e2e8f0;
  margin: 0;
  max-width: 600px;
}

.event-countdown {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  padding: 20px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.countdown-title {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 12px;
}

.countdown-boxes {
  display: flex;
  gap: 8px;
}

.countdown-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  width: 52px;
  height: 52px;
}

.countdown-box strong {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.countdown-box span {
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 700;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .event-hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .event-hero-info h1 {
    font-size: 2rem;
  }
}
</style>
