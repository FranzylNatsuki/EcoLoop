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

export function calculateEventProgress(materials: any[]): number {
  if (!materials || materials.length === 0) return 0

  const totalTarget = materials.reduce((sum, mat) => {
    const qty = Number(mat.target_quantity ?? mat.target ?? 0)
    return sum + (isNaN(qty) ? 0 : qty)
  }, 0)

  const totalCurrent = materials.reduce((sum, mat) => {
    const qty = Number(mat.current_quantity ?? mat.current ?? 0)
    return sum + (isNaN(qty) ? 0 : qty)
  }, 0)

  if (totalTarget <= 0) return 0

  return Math.min(100, Math.round((totalCurrent / totalTarget) * 100))
}

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
    // FIX 1: Correctly check for empty array before falling back to parseMaterials
    const hasDbMaterials = Array.isArray(row.event_materials) && row.event_materials.length > 0
    const rawMaterials = hasDbMaterials ? row.event_materials : parseMaterials(row.materials_needed)

    // FIX 2: Added safety guard (rawMaterials || []) to prevent runtime crash
    const materials: MaterialNeed[] = (rawMaterials || []).map((m: any) => ({
      id: m.id,
      material: m.material_name || m.material || m.name || 'Material',
      target: Number(m.target_quantity || m.target || m.quantity) || 0,
      current: Number(m.current_quantity || m.current) || 0,
      unit: m.unit || 'pcs'
    }))

    const totalTarget = materials.reduce((acc, m) => acc + m.target, 0)
    const totalCurrent = materials.reduce((acc, m) => acc + m.current, 0)
    const fulfillmentPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0

    const eventDate = new Date(row.event_date || row.schedule || Date.now())
    const diffTime = eventDate.getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    // FIX 3: Unpack author & profile_data arrays from Supabase query response
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
      materials_needed: materials,
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

  // Fetch Events
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

  // Fetch Single Event
  async function fetchEventById(id: string): Promise<EventItem | null> {
    loading.value = true // FIX 4: Explicitly set loading state
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

      // --- B. Unique Contributors Count ---
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

      // --- C. Top Donors ---
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

      // --- D. Calculate Material Totals ---
      const materialPledgedMap = new Map<string, number>()
      for (const item of allItems) {
        const matName = (item.material_name || '').trim().toLowerCase()
        if (matName) {
          const currentTotal = materialPledgedMap.get(matName) || 0
          materialPledgedMap.set(matName, currentTotal + (Number(item.quantity) || 0))
        }
      }

      if (data.event_materials && Array.isArray(data.event_materials)) {
        data.event_materials = data.event_materials.map((mat: any) => {
          const matNameKey = (mat.material_name || '').trim().toLowerCase()
          const pledgedQty = materialPledgedMap.get(matNameKey)
          return {
            ...mat,
            current_quantity: pledgedQty !== undefined ? pledgedQty : (mat.current_quantity || 0)
          }
        })
      }

      // --- E. Fetch Related Events ---
      const { data: relatedData } = await supabase
        .from('events')
        .select(`
          id, title, category, banner_url, materials_needed,
          event_materials ( target_quantity, current_quantity )
        `)
        .neq('id', id)
        .limit(3)

      const relatedEvents: RelatedEvent[] = (relatedData || []).map((rel: any) => {
        const mats = rel.event_materials || []
        const progressPercent = calculateEventProgress(mats)

        return {
          id: rel.id,
          title: rel.title || 'Untitled Event',
          category: rel.category || 'Community',
          image: rel.banner_url || 'https://placehold.co/600x360',
          fulfillment_percent: progressPercent
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
          total_donors: uniqueContributorsCount,
          total_pledged: totalPledgedSum
        }
      }
    } catch (err: any) {
      console.error('Error fetching event details:', err.message || err)
      return null
    } finally {
      loading.value = false // FIX 4: Always reset loading state
    }
  }

  // Create Event
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
        const materialInserts = newEventData.materials_needed.map(m => ({
          event_id: eventData.id,
          material_name: m.material,
          target_quantity: m.target,
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

  // Submit Pledge
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
