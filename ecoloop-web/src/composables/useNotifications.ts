import { ref } from 'vue'
import { supabase } from './useAuth'

export function useNotifications() {
  const notifications = ref<any[]>([])
  const hasUnread = ref(false)
  const isLoading = ref(true)

  const fetchNotifications = async () => {
    isLoading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      isLoading.value = false
      return
    }

    const { data: pledgesData } = await supabase
      .from('pledges')
      .select(`
        id, created_at, status, donor_id, post_id,
        donor:profiles!pledges_donor_id_fkey(full_name),
        post:cause_requests!inner(title, author_id)
      `)
      .eq('cause_requests.author_id', session.user.id)

    const { data: eventPledgesData } = await supabase
      .from('event_pledges')
      .select(`
        id, created_at, status, donor_id, event_id,
        donor:profiles!donor_id(full_name),
        post:events!inner(title, author_id)
      `)
      .eq('events.author_id', session.user.id)
      
    const { data: purchaseData } = await supabase
      .from('purchase_requests')
      .select(`
        id, created_at, status, buyer_id, post_id,
        post:marketplace_listings(title)
      `)
      .eq('seller_id', session.user.id)

    let combined: any[] = []

    if (pledgesData) combined = [...combined, ...pledgesData.map(n => ({ ...n, pledgeType: 'cause' }))]
    if (eventPledgesData) combined = [...combined, ...eventPledgesData.map(n => ({ ...n, pledgeType: 'event' }))]
    
    if (purchaseData && purchaseData.length > 0) {
      const buyerIds = [...new Set(purchaseData.map(r => r.buyer_id).filter(Boolean))]
      let profileMap = new Map()
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select(`id, full_name`).in('id', buyerIds)
        if (profiles) profiles.forEach((p: any) => profileMap.set(p.id, p))
      }
      const pr = purchaseData.map(n => {
        const pPost = Array.isArray(n.post) ? n.post[0] : n.post
        return {
          ...n,
          pledgeType: 'marketplace',
          post: { title: pPost?.title || 'Unknown Listing' }, 
          buyer: profileMap.get(n.buyer_id) || null
        }
      })
      combined = [...combined, ...pr]
    }

    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    notifications.value = combined.slice(0, 10)

    // Evaluate unread logic
    const lastCheckStr = localStorage.getItem('last_notif_check')
    const lastCheck = lastCheckStr ? new Date(lastCheckStr).getTime() : 0
    hasUnread.value = notifications.value.some(n => new Date(n.created_at).getTime() > lastCheck)

    isLoading.value = false
  }

  const markAsRead = () => {
    localStorage.setItem('last_notif_check', new Date().toISOString())
    hasUnread.value = false
  }

  return {
    notifications,
    isLoading,
    hasUnread,
    fetchNotifications,
    markAsRead
  }
}
