import { ref, onMounted } from 'vue'
import type { EventItem } from '../types/event'

const events = ref<EventItem[]>([])
const API_URL = 'http://localhost:3001/events'

interface EventModalPayload {
  event: {
    title?: string
    description?: string
    category?: string
    bannerImage?: string
    date?: string
    startTime?: string
    endTime?: string
    location?: string
    organizer?: string
  }
  materials: { id: string; name: string; quantity: number | string; unit: string }[]
}

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

  async function addEvent(payload: EventModalPayload) {
    const { event, materials } = payload

    const schedule = event.date && event.startTime
      ? `${event.date}T${event.startTime}:00`
      : event.date || ''

    const newEvent: Omit<EventItem, 'id'> = {
      type: 'event',
      event_title: event.title || 'Untitled Event',
      schedule,
      location: event.location || '',
      description: event.description || '',
      images: event.bannerImage ? [event.bannerImage] : [],
      category: event.category,
      organizer: event.organizer
        ? { name: event.organizer, avatar: 'https://placehold.co/48x48', bio: '', verified: false }
        : undefined,
      materials_needed: materials.map((m) => ({
        material: m.name,
        unit: m.unit,
        target: Number(m.quantity) || 0,
        current: 0
      })),
      fulfillment_percent: 0
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      })
      const created = await res.json()
      events.value.unshift(created)
      return created
    } catch (err) {
      console.error('Error saving event to json-server:', err)
    }
  }

  onMounted(() => {
    if (events.value.length === 0) fetchEvents()
  })

  return { events, fetchEvents, fetchEventById, addEvent }
}
