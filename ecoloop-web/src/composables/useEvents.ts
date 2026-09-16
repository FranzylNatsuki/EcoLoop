import { ref, onMounted } from 'vue'
import type { EventItem } from '../types/event'

const events = ref<EventItem[]>([])
const API_URL = 'http://localhost:3001/events'

export function useEvents() {
  async function fetchEvents() {
    try {
      const res = await fetch(API_URL)
      events.value = await res.json()
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  }

  async function fetchEventById(id: string) {
    try {
      const res = await fetch(`${API_URL}/${id}`)
      return (await res.json()) as EventItem
    } catch (err) {
      console.error('Error fetching event:', err)
      return null
    }
  }

  onMounted(() => {
    if (events.value.length === 0) fetchEvents()
  })

  return { events, fetchEvents, fetchEventById }
}
