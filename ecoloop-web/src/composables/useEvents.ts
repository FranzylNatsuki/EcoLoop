import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'
import type { EventItem, MaterialNeed, RelatedEvent, Pledge, Organizer } from '../types/event'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const events = ref<EventItem[]>([]) 
const loading = ref(false)

export function useEvents() {
  function parseMaterials(materialsJson: any): MaterialNeed[] {
    try {
      const parsed = typeof materialsJson === 'string' ? JSON.parse(materialsJson) : materialsJson
      if (!Array.isArray(parsed)) return []
      return parsed.map((m: any) => ({
        material: m.material || m.name || 'Material',
        unit: m.unit || 'pcs',
        target: Number(m.target || m.quantity) || 0,
        current: Number(m.current) || 0
      }))
    } catch {
      return []
    }
  }

  // Replace transformSupabaseToEventItem in useEvents.ts
  function transformSupabaseToEventItem(row: any): EventItem {
    const materials = parseMaterials(row.materials_needed)

    const totalTarget = materials.reduce((acc, m) => acc + m.target, 0)
    const totalCurrent = materials.reduce((acc, m) => acc + m.current, 0)
    const fulfillmentPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0

    const eventDate = new Date(row.event_date || row.schedule || Date.now())
    const diffTime = eventDate.getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    const authorProfile = row.author

    const eventImageUrl =
      row.banner_url ||
      row.image_url ||
      (row.event_images && row.event_images[0]?.image_url) ||
      (row.post_images && row.post_images[0]?.image_url) ||
      ''

    const avatarUrl =
      authorProfile?.profile_data?.Avatar ||
      authorProfile?.Avatar ||
      row.organizer?.avatar ||
      'https://placehold.co/44x44'

    const organizer: Organizer = {
      name: authorProfile?.full_name || row.organizer?.name || 'Community Organizer',
      avatar: avatarUrl,
      bio: authorProfile?.profile_data?.about || row.organizer?.bio || '',
      verified: false
    }

    return {
      type: 'event',
      id: row.id,
      event_title: row.title || row.event_title || 'Untitled Event',
      schedule: row.event_date || row.schedule || '',
      location: row.location || 'Location TBA',
      description: row.description || '',
      category: row.category || 'General',
      image: eventImageUrl,
      materials_needed: materials,
      fulfillment_percent: fulfillmentPercent,
      organizer,
      stats: {
        days_left: daysLeft,
        total_donors: 0,
        total_pledged: totalCurrent
      }
    }
  }

  async function fetchEvents(options?: { category?: string; limit?: number }) {
    loading.value = true
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          author:profiles (
            full_name,
            profile_data:profile_data_fk (
              Avatar,
              about
            )
          )
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
      console.error('Supabase fetch error:', err.message || err)
    } finally {
      loading.value = false
    }
  }

  async function fetchEventById(id: string): Promise<EventItem | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          author:profiles (
            full_name,
            profile_data:profile_data_fk (
              Avatar,
              about
            )
          ),
          post_images ( image_url, display_order )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      const { data: pledgeItemsData } = await supabase
        .from('event_pledge_items')
        .select(`
          id,
          quantity,
          unit,
          item_name,
          created_at,
          pledge:event_pledges!inner ( // Updated table name reference
            user:profiles (
              full_name,
              profile_data:profile_data_fk (Avatar)
            )
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

      const recentPledges: Pledge[] = (pledgeItemsData || []).map((item: any) => ({
        id: item.id,
        donor: item.pledge?.user?.full_name || 'Anonymous Supporter',
        donor_avatar: item.pledge?.user?.profile_data?.Avatar || 'https://placehold.co/38x38',
        quantity: `${item.quantity || 1} ${item.item_name || item.unit || 'items'}`,
        time: new Date(item.created_at).toLocaleDateString()
      }))

      const { data: topDonorsData } = await supabase
        .from('event_pledge_items') // Updated table name
        .select(`
          id,
          quantity,
          item_name,
          pledge:event_pledges!inner ( // Updated table name reference
            user_id,
            user:profiles (
              full_name,
              profile_data:profile_data_fk (Avatar)
            )
          )
        `)
        .eq('event_id', id)
        .limit(5)

      const topDonors: Pledge[] = (topDonorsData || []).map((td: any, index: number) => ({
        id: td.id || String(index),
        donor: td.pledge?.user?.full_name || 'Community Supporter',
        donor_avatar: td.pledge?.user?.profile_data?.Avatar || 'https://placehold.co/38x38',
        quantity: `${td.quantity || 1} items pledged`,
        time: 'Top Contributor'
      }))

      const { data: relatedData } = await supabase
        .from('events')
        .select('id, title, category, banner_url, image_url, materials_needed')
        .neq('id', id)
        .limit(3)

      const relatedEvents: RelatedEvent[] = (relatedData || []).map((rel: any) => {
        const relMaterials = parseMaterials(rel.materials_needed)
        const relTarget = relMaterials.reduce((acc, m) => acc + m.target, 0)
        const relCurrent = relMaterials.reduce((acc, m) => acc + m.current, 0)
        const relPercent = relTarget > 0 ? Math.min(100, Math.round((relCurrent / relTarget) * 100)) : 0

        return {
          id: rel.id,
          title: rel.title || 'Untitled Event',
          category: rel.category || 'Community',
          image: rel.banner_url || 'https://placehold.co/600x360',
          fulfillment_percent: relPercent
        }
      })

      const eventItem = transformSupabaseToEventItem(data)
      const materialsList = eventItem.materials_needed || []
      const totalPledgedSum = materialsList.reduce((acc, m) => acc + (m.current || 0), 0)

      return {
        ...eventItem,
        recent_pledges: recentPledges,
        top_donors: topDonors,
        related_events: relatedEvents,
        stats: {
          days_left: eventItem.stats?.days_left || 0,
          total_donors: (pledgeItemsData || []).length,
          total_pledged: totalPledgedSum
        }
      }
    } catch (err: any) {
      console.error('Supabase event lookup error:', err.message || err)
      return null
    }
  }

  async function createEvent(eventData: {
    title: string
    description: string
    category: string
    location: string
    event_date: string
    banner_url?: string
    materials_needed?: Array<{ material: string; target: number; current: number; unit: string }>
  }) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User authentication required to post an event.')

      const payload = {
        author_id: user.id,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        location: eventData.location,
        event_date: eventData.event_date,
        banner_url: eventData.banner_url || null,
        materials_needed: JSON.stringify(eventData.materials_needed || [])
      }

      const { data, error } = await supabase
        .from('events')
        .insert([payload])
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      console.error('Error publishing event:', err.message || err)
      return { success: false, error: err.message || err }
    }
  }

  async function submitPledge(payload: {
    eventId: string
    itemName: string
    quantity: number
    unit: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User authentication required to donate.')

      const { data: pledgeData, error: pledgeError } = await supabase
        .from('event_pledges')
        .insert([{ event_id: payload.eventId, user_id: user.id }])
        .select()
        .single()

      if (pledgeError) throw pledgeError

      const { error: itemError } = await supabase
        .from('event_pledge_items')
        .insert([{
          pledge_id: pledgeData.id,
          event_id: payload.eventId,
          item_name: payload.itemName,
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

  return {
    events,
    loading,
    fetchEvents,
    fetchEventById,
    createEvent,
    submitPledge
  }
}
