import { ref, onMounted } from 'vue'
import { supabase } from './useAuth'

export interface Author {
  full_name: string
  Avatar: string
  about?: string
}

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
  donor_id?: string
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
  donated_items?: number
  target_items?: number
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

export function calculateEventProgress(event: any): number {
  const goal = Number(event.target_items || 0)
  const donated = Number(event.donated_items || 0)

  if (goal <= 0) return event.fulfillment_percent || 0

  return Math.min(100, Math.round((donated / goal) * 100))
}

export function useEvents() {
  function transformSupabaseToEventItem(row: any): EventItem {
    const donatedItems = Number(row.donated_items || 0)

<<<<<<< HEAD
    // 1. Calculate total goal from materials_needed array
    const rawMaterials = Array.isArray(row.materials_needed) ? row.materials_needed : []
    const computedTarget = rawMaterials.reduce(
      (sum: number, mat: any) => sum + (Number(mat.target) || 0),
      0
    )

    const targetItems = Number(row.target_items) || computedTarget

    // 2. Compute percentage accurately
    const fulfillmentPercent = targetItems > 0
      ? Math.min(100, Math.round((donatedItems / targetItems) * 100))
      : (row.fulfillment_percent || 0)
=======
      // 1. Calculate total goal from materials_needed array
      const rawMaterials = Array.isArray(row.materials_needed) ? row.materials_needed : []
      const computedTarget = rawMaterials.reduce(
        (sum: number, mat: any) => sum + (Number(mat.target) || 0),
        0
      )

    const targetItems = Number(row.target_items) || computedTarget

      // 2. Compute percentage accurately
      const fulfillmentPercent = targetItems > 0
        ? Math.min(100, Math.round((donatedItems / targetItems) * 100))
        : (row.fulfillment_percent || 0)
>>>>>>> origin/9/25/26-filter

    const eventDate = new Date(row.event_date || row.schedule || Date.now())
    const diffTime = eventDate.getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author
    const rawProfile = Array.isArray(rawAuthor?.profile_data) ? rawAuthor?.profile_data[0] : rawAuthor?.profile_data

    const authorFullName = rawAuthor?.full_name || 'Community Organizer'
    const authorAvatar = rawProfile?.Avatar || 'https://placehold.co/44x44'
    const authorBio = rawProfile?.about || ''

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
      materials_needed: row.materials_needed || [],
      fulfillment_percent: fulfillmentPercent,
      donated_items: donatedItems,
      target_items: targetItems,
      organizer: {
        name: authorFullName,
        avatar: authorAvatar,
        bio: authorBio,
        verified: false
      },
      stats: {
        days_left: daysLeft,
        total_donors: 0,
        total_pledged: donatedItems
      }
    }
  }

  // Fetch Events
<<<<<<< HEAD
  async function fetchEvents(options?: { category?: string; limit?: number; searchQuery?: string }) {
=======
  // Fetch Events
  async function fetchEvents(options?: { category?: string; limit?: number }) {
>>>>>>> origin/9/25/26-filter
    loading.value = true
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data:profile_data_fk ( Avatar, about )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 20)

      if (options?.category && options.category !== 'All') {
        query = query.ilike('category', options.category.trim())
      }

      // Connect the search query to Postgres
      if (options?.searchQuery && options.searchQuery.trim().length > 0) {
        const terms = options.searchQuery.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)

        if (terms.length > 0 && terms[0] !== '') {
          const formattedQuery = terms.join(' & ') + ':*'

          query = query.textSearch('fts', formattedQuery, {
            config: 'english'
          })
        }
      }

      const { data: eventsData, error } = await query
      if (error) throw error

      // Fetch pledge items directly instead of querying missing view
      const { data: pledgeItemsData, error: pledgeError } = await supabase
        .from('event_pledge_items')
        .select(`
          quantity,
          pledge:event_pledges!event_pledge_id!inner (
            event_id
          )
        `)

      if (pledgeError) {
        console.warn('Could not fetch pledge items totals:', pledgeError.message)
      }

      // Sum donated quantities per event ID
      const totalsMap = new Map<string, number>()
      if (pledgeItemsData) {
        pledgeItemsData.forEach((item: any) => {
          const pledge = Array.isArray(item.pledge) ? item.pledge[0] : item.pledge
          const eventId = pledge?.event_id
          if (eventId) {
            const current = totalsMap.get(eventId) || 0
            totalsMap.set(eventId, current + (Number(item.quantity) || 0))
          }
        })
      }

      if (eventsData) {
        events.value = eventsData.map((row: any) => {
          const donated = totalsMap.get(row.id) || 0
          return transformSupabaseToEventItem({ ...row, donated_items: donated })
        })
      }
    } catch (err: any) {
      console.error('Error fetching events from Supabase:', err.message || err)
    } finally {
      loading.value = false
    }
  }

  async function fetchEventById(id: string): Promise<EventItem | null> {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data:profile_data_fk ( Avatar, about )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      const { data: pledgeItemsData, error: pledgeError } = await supabase
        .from('event_pledge_items')
        .select(`
          id, quantity, unit, material_name, created_at,
          pledge:event_pledges!event_pledge_id!inner (
            id,
            event_id,
            donor_id,
            donor:profiles!donor_id (
              full_name,
              profile_data:profile_data_fk (Avatar)
            )
          )
        `)
        .eq('pledge.event_id', id)
        .order('created_at', { ascending: false })

      if (pledgeError) console.error("Pledge fetch error:", pledgeError)

      const allItems = pledgeItemsData || []

      // 1. Calculate total donated items directly from pledge items
      const calculatedTotalDonated = allItems.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity) || 0)
      }, 0)

      // 2. Map material_needed and calculate 'current' for each item dynamically
      const rawMaterials: MaterialNeed[] = data.materials_needed || []
      const updatedMaterials = rawMaterials.map((mat) => {
        const currentQty = allItems
          .filter((item: any) =>
            item.material_name?.toLowerCase().trim() === mat.material?.toLowerCase().trim()
          )
          .reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)

        return {
          ...mat,
          current: currentQty
        }
      })

      // --- A. Recent Pledges ---
      const recentPledges: Pledge[] = allItems.slice(0, 5).map((item: any) => {
        const pledge = Array.isArray(item.pledge) ? item.pledge[0] : item.pledge
        const donor = Array.isArray(pledge?.donor) ? pledge?.donor[0] : pledge?.donor
        const profile = Array.isArray(donor?.profile_data) ? donor?.profile_data[0] : donor?.profile_data

        return {
          id: item.id,
          donor_id: pledge?.donor_id,
          donor: donor?.full_name || 'Anonymous Supporter',
          donor_avatar: profile?.Avatar || 'https://placehold.co/38x38',
          quantity: `${item.quantity || 1} ${item.material_name || item.unit || 'items'}`,
          time: new Date(item.created_at).toLocaleDateString()
        }
      })

      const uniqueDonorKeys = new Set(
        allItems
          .map((item: any) => {
            const pledge = Array.isArray(item.pledge) ? item.pledge[0] : item.pledge
            const donor = Array.isArray(pledge?.donor) ? pledge?.donor[0] : pledge?.donor
            return pledge?.donor_id || donor?.full_name
          })
          .filter(Boolean)
      )
      const uniqueContributorsCount = uniqueDonorKeys.size

      const donorMap = new Map<string, {
        id: string
        donor: string
        donor_avatar: string
        totalQuantity: number
      }>()

      for (const item of allItems) {
        const itemAny = item as any
        const pledge = Array.isArray(itemAny.pledge) ? itemAny.pledge[0] : itemAny.pledge
        const donor = Array.isArray(pledge?.donor) ? pledge?.donor[0] : pledge?.donor
        const profile = Array.isArray(donor?.profile_data) ? donor?.profile_data[0] : donor?.profile_data

        const donorKey = pledge?.donor_id || donor?.full_name || 'anonymous'
        const donorName = donor?.full_name || 'Community Supporter'
        const avatar = profile?.Avatar || 'https://placehold.co/38x38'

        const rawQty = itemAny.quantity
        const parsedQty = typeof rawQty === 'number' ? rawQty : parseInt(String(rawQty || 0), 10)
        const qty = isNaN(parsedQty) ? 0 : parsedQty

        if (!donorMap.has(donorKey)) {
          donorMap.set(donorKey, {
            id: String(donorKey),
            donor: donorName,
            donor_avatar: avatar,
            totalQuantity: qty
          })
        } else {
          donorMap.get(donorKey)!.totalQuantity += qty
        }
      }

      const topDonors: Pledge[] = Array.from(donorMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5)
        .map((td) => ({
          id: td.id,
          donor: td.donor,
          donor_avatar: td.donor_avatar,
          quantity: `${td.totalQuantity} items pledged`,
          time: 'Top Contributor'
        }))

      // --- D. Fetch Single Event Donated Total ---
      const { data: totalRow } = await supabase
        .from('event_funding_totals')
        .select('donated_items')
        .eq('event_id', id)
        .single()

      const donatedItems = calculatedTotalDonated > 0 ? calculatedTotalDonated : Number(totalRow?.donated_items || 0)

      const { data: relatedData } = await supabase
        .from('events')
        .select('id, title, category, banner_url')
        .neq('id', id)
        .limit(3)

      const relatedEvents: RelatedEvent[] = (relatedData || []).map((rel: any) => ({
        id: rel.id,
        title: rel.title || 'Untitled Event',
        category: rel.category || 'Community',
        image: rel.banner_url || 'https://placehold.co/600x360',
        fulfillment_percent: calculateEventProgress(rel)
      }))

      const eventItem = transformSupabaseToEventItem({ ...data, donated_items: donatedItems })

      return {
        ...eventItem,
        materials_needed: updatedMaterials,
        recent_pledges: recentPledges,
        top_donors: topDonors,
        related_events: relatedEvents,
        stats: {
          days_left: eventItem.stats.days_left,
          total_donors: uniqueContributorsCount,
          total_pledged: donatedItems
        }
      }
    } catch (err: any) {
      console.error('Error fetching event details:', err.message || err)
      return null
    } finally {
      loading.value = false
    }
  }

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
          banner_url: newEventData.banner_url || null,
          materials_needed: newEventData.materials_needed || []
        })
        .select()
        .single()

      if (eventError) throw eventError

      await fetchEvents()
      return { success: true, data: eventData }
    } catch (err: any) {
      console.error('Error saving event to Supabase:', err.message || err)
      return { success: false, error: err.message || err }
    }
  }

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
