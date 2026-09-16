export interface MaterialNeed {
  material: string
  unit: string
  target: number
  current: number
}

export interface Pledge {
  id: string
  donor: string
  donor_avatar?: string
  quantity: string
  time: string
}

export interface Organizer {
  name: string
  avatar: string
  bio: string
  verified: boolean
  events_hosted?: number
  contact_url?: string
}

export interface RelatedEvent {
  id: number | string
  title: string
  image: string
  category: string
  fulfillment_percent?: number
}

export interface EventItem {
  type: 'event'
  id: number | string
  org_id?: string
  event_title: string
  schedule: string
  location: string
  description: string
  images?: string[]
  category?: string

  // RSVP-style (used by simpler events)
  participant_goal?: number
  attendees_count?: number

  // Campaign-style (used by EventsView + MaterialsNeededCard etc.)
  urgency_tag?: string
  materials_needed?: MaterialNeed[]
  fulfillment_percent?: number
  stats?: { days_left: number; total_donors: number; total_pledged: number }
  recent_pledges?: Pledge[]
  top_donors?: Pledge[]
  organizer?: Organizer
  related_events?: RelatedEvent[]
}
