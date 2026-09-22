import { ref, onMounted } from 'vue'
import { supabase } from './useAuth'

export interface Author {
  full_name: string
  Avatar: string
  about?: string
}

// RESTORED TO MATCH UI EXPECTATIONS
export interface MaterialNeed {
  id?: string
  material: string
  target: number
  current: number
  unit: string
}

export interface Organizer {
  name: string
  avatar: string
  bio: string
  verified: boolean
}

export interface EventStats {
  days_left: number
  total_donors: number
  total_pledged: number
}

export interface Pledge {
  id: string
  donor: string
  donor_avatar: string
  quantity: string
  time: string
}

export interface RelatedEvent {
  id: string
  title: string
  category: string
  image: string
  fulfillment_percent: number
}

export interface EventItem {
  type: 'event'
  id: string
  event_title: string
  schedule: string
  location: string
  latitude?: number | null
  longitude?: number | null
  description: string
  category: string
  image: string
  materials_needed: MaterialNeed[]
  fulfillment_percent: number
  organizer: Organizer
  stats: EventStats
  recent_pledges?: Pledge[]
  top_donors?: Pledge[]
  related_events?: RelatedEvent[]
}

export interface CreateEventPayload {
  title: string
  description: string
  category: string
  location: string
  latitude?: number | null
  longitude?: number | null
  event_date: string
  banner_url?: string
  materials_needed?: MaterialNeed[]
}

export interface SubmitPledgePayload {
  eventId: string
  itemName: string
  quantity: number
  unit: string
}

const events = ref<EventItem[]>([])
const loading = ref(false)

export function useEvents() {

  function parseMaterials(materialsJson: any): any[] {
      try {
        const parsed = typeof materialsJson === 'string' ? JSON.parse(materialsJson) : materialsJson
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
  }

  function transformSupabaseToEventItem(row: any): EventItem {
    // 1. ADAPTER: Translate new DB columns to what the UI expects
    const rawMaterials = row.event_materials || parseMaterials(row.materials_needed)

    const materials: MaterialNeed[] = rawMaterials.map((m: any) => ({
      id: m.id,
      material: m.material_name || m.material || m.name || 'Material', // Maps DB to UI
      target: Number(m.target_quantity || m.target || m.quantity) || 0, // Maps DB to UI
      current: Number(m.current_quantity || m.current) || 0,            // Maps DB to UI
      unit: m.unit || 'pcs'
    }))

    const totalTarget = materials.reduce((acc, m) => acc + m.target, 0)
    const totalCurrent = materials.reduce((acc, m) => acc + m.current, 0)
    const fulfillmentPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0

    const eventDate = new Date(row.event_date || row.schedule || Date.now())
    const diffTime = eventDate.getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    const authorFullName = row.author?.full_name || 'Community Organizer'
    const authorAvatar = row.author?.profile_data?.Avatar || 'https://placehold.co/44x44'
    const authorBio = row.author?.profile_data?.about || ''

    return {
      type: 'event',
      id: row.id,
      event_title: row.title || 'Untitled Event',
      schedule: row.event_date || '',
      location: row.location || 'Location TBA',
      latitude: row.latitude,
      longitude: row.longitude,
      description: row.description || '',
      category: row.category || 'General',
      image: row.banner_url || '',
      materials_needed: materials, // Passed exactly as UI expects
      fulfillment_percent: fulfillmentPercent,
      organizer: {
        name: authorFullName,
        avatar: authorAvatar,
        bio: authorBio,
        verified: false
      },
      stats: {
        days_left: daysLeft,
        total_donors: 0,
        total_pledged: totalCurrent
      }
    }
  }

  // 2. Fetch Events
  async function fetchEvents(options?: { category?: string; limit?: number }) {
    loading.value = true
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data:profile_data_fk ( Avatar, about )
          ),
          event_materials ( id, material_name, target_quantity, current_quantity, unit )
        `)
        .order('created_at', { ascending: false })

      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      if (data) {
        events.value = data.map((row: any) => transformSupabaseToEventItem(row))
      }
    } catch (err: any) {
      console.error('Error fetching events from Supabase:', err.message || err)
    } finally {
      loading.value = false
    }
  }

  // 3. Fetch Single Event
  async function fetchEventById(id: string): Promise<EventItem | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data:profile_data_fk ( Avatar, about )
          ),
          event_materials ( id, material_name, target_quantity, current_quantity, unit )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      const { data: pledgeItemsData, error: pledgeError } = await supabase
        .from('event_pledge_items')
        .select(`
          id, quantity, unit, material_name, created_at,
          pledge:event_pledges!inner (
            event_id,
            donor:profiles!donor_id (
              full_name,
              profile_data:profile_data_fk (Avatar)
            )
          )
        `)
        .eq('pledge.event_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (pledgeError) console.error("Pledge fetch error:", pledgeError)

      const recentPledges: Pledge[] = (pledgeItemsData || []).map((item: any) => ({
        id: item.id,
        donor: item.pledge?.donor?.full_name || 'Anonymous Supporter',
        donor_avatar: item.pledge?.donor?.profile_data?.Avatar || 'https://placehold.co/38x38',
        quantity: `${item.quantity || 1} ${item.material_name || item.unit || 'items'}`,
        time: new Date(item.created_at).toLocaleDateString()
      }))

      const { data: topDonorsData } = await supabase
        .from('event_pledge_items')
        .select(`
          id, quantity, material_name,
          pledge:event_pledges!inner (
            event_id,
            donor:profiles!donor_id (
              full_name,
              profile_data:profile_data_fk (Avatar)
            )
          )
        `)
        .eq('pledge.event_id', id)
        .order('quantity', { ascending: false })
        .limit(5)

      const topDonors: Pledge[] = (topDonorsData || []).map((td: any, index: number) => ({
        id: td.id || String(index),
        donor: td.pledge?.donor?.full_name || 'Community Supporter',
        donor_avatar: td.pledge?.donor?.profile_data?.Avatar || 'https://placehold.co/38x38',
        quantity: `${td.quantity || 1} items pledged`,
        time: 'Top Contributor'
      }))

      const { data: relatedData } = await supabase
        .from('events')
        .select(`
          id, title, category, banner_url, materials_needed,
          event_materials ( target_quantity, current_quantity )
        `)
        .neq('id', id)
        .limit(3)

      const relatedEvents: RelatedEvent[] = (relatedData || []).map((rel: any) => {
        const relMaterials = rel.event_materials || parseMaterials(rel.materials_needed)
        const relTarget = relMaterials.reduce((acc: number, m: any) => acc + (m.target_quantity || m.target || 0), 0)
        const relCurrent = relMaterials.reduce((acc: number, m: any) => acc + (m.current_quantity || m.current || 0), 0)

        return {
          id: rel.id,
          title: rel.title || 'Untitled Event',
          category: rel.category || 'Community',
          image: rel.banner_url || 'https://placehold.co/600x360',
          fulfillment_percent: relTarget > 0 ? Math.min(100, Math.round((relCurrent / relTarget) * 100)) : 0
        }
      })

      const eventItem = transformSupabaseToEventItem(data)
      const totalPledgedSum = (eventItem.materials_needed || []).reduce((acc, m) => acc + (m.current || 0), 0)

      return {
        ...eventItem,
        recent_pledges: recentPledges,
        top_donors: topDonors,
        related_events: relatedEvents,
        stats: {
          days_left: eventItem.stats.days_left,
          total_donors: (pledgeItemsData || []).length,
          total_pledged: totalPledgedSum
        }
      }
    } catch (err: any) {
      console.error('Error fetching event details:', err.message || err)
      return null
    }
  }

  // 4. Create Event
  async function createEvent(newEventData: CreateEventPayload) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) return { success: false, error: 'Unauthorized' }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          author_id: session.user.id,
          title: newEventData.title,
          description: newEventData.description,
          category: newEventData.category,
          location: newEventData.location,
          latitude: newEventData.latitude || null,
          longitude: newEventData.longitude || null,
          event_date: newEventData.event_date,
          banner_url: newEventData.banner_url || null
        })
        .select()
        .single()

      if (eventError) throw eventError

      if (newEventData.materials_needed && newEventData.materials_needed.length > 0) {
        // ADAPTER: Translate the UI's 'material' back into the DB's 'material_name'
        const materialInserts = newEventData.materials_needed.map(m => ({
          event_id: eventData.id,
          material_name: m.material, // Matches UI
          target_quantity: m.target, // Matches UI
          current_quantity: 0,
          unit: m.unit
        }))

        const { error: materialsError } = await supabase
          .from('event_materials')
          .insert(materialInserts)

        if (materialsError) throw materialsError
      }

      await fetchEvents()
      return { success: true, data: eventData }
    } catch (err: any) {
      console.error('Error saving event to Supabase:', err.message || err)
      return { success: false, error: err.message || err }
    }
  }

  // 5. Submit Pledge
  async function submitPledge(payload: SubmitPledgePayload) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) return { success: false, error: 'Unauthorized' }

      const { data: pledgeData, error: pledgeError } = await supabase
        .from('event_pledges')
        .insert([{
          event_id: payload.eventId,
          donor_id: session.user.id
        }])
        .select()
        .single()

      if (pledgeError) throw pledgeError

      const { error: itemError } = await supabase
        .from('event_pledge_items')
        .insert([{
          event_pledge_id: pledgeData.id,
          material_name: payload.itemName,
          quantity: payload.quantity,
          unit: payload.unit
        }])

      if (itemError) throw itemError

      return { success: true }
    } catch (err: any) {
      console.error('Error submitting donation:', err.message || err)
      return { success: false, error: err.message || err }
    }
  }

  onMounted(() => {
    if (events.value.length === 0) {
      fetchEvents()
    }
  })

  return {
    events,
    loading,
    fetchEvents,
    fetchEventById,
    createEvent,
    submitPledge
  }
}
