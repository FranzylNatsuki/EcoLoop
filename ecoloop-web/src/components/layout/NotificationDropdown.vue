<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../composables/useAuth'
import NotificationItem from './NotificationItem.vue'


const notifications = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  // Query pledges where the related post's author is the current user
  // We use !inner to filter the parent table based on the joined table
  const { data: pledgesData, error: pledgesError } = await supabase
    .from('pledges')
    .select(`
      id,
      created_at,
      status,
      donor:profiles!pledges_donor_id_fkey(full_name),
      post:cause_requests!inner(title, author_id)
    `)
    .eq('cause_requests.author_id', session.user.id)

  
  const { data: eventPledgesData, error: eventPledgesError } = await supabase
    .from('event_pledges')
    .select(`
      id,
      created_at,
      status,
      donor:profiles!donor_id(full_name),
      post:events!inner(title, author_id)
    `)
    .eq('events.author_id', session.user.id)

  // -- Add Marketplace Purchase Requests Query --
  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchase_requests')
    .select(`
      id,
      created_at,
      status,
      buyer_id,
      post_id,
      post:marketplace_listings(title)
    `)
    .eq('seller_id', session.user.id)


  let combined: any[] = []

  if (pledgesError) {
    console.error('Error fetching cause pledges:', pledgesError.message)
  } else if (pledgesData) {
    const p = pledgesData.map(n => ({ ...n, pledgeType: 'cause' }))
    combined = [...combined, ...p]
  }

  
  if (eventPledgesError) {
    console.error('Error fetching event pledges:', eventPledgesError.message)
  } else if (eventPledgesData) {
    const ep = eventPledgesData.map(n => ({ ...n, pledgeType: 'event' }))
    combined = [...combined, ...ep]
  }

  // Combine Purchase Requests
  if (purchaseError) {
    console.error('Error fetching purchase requests:', purchaseError.message)
  } else if (purchaseData && purchaseData.length > 0) {
    const buyerIds = [...new Set(purchaseData.map(r => r.buyer_id).filter(Boolean))]
    let profileMap = new Map()

    if (buyerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`id, full_name`)
        .in('id', buyerIds)

      if (profiles) {
        profiles.forEach((p: any) => profileMap.set(p.id, p))
      }
    }

    const pr = purchaseData.map(n => {
      const pPost = Array.isArray(n.post) ? n.post[0] : n.post
      return {
        ...n,
        pledgeType: 'marketplace',
        post: { title: pPost?.title || 'Unknown Listing' }, // Map expected post title format
        buyer: profileMap.get(n.buyer_id) || null
      }
    })
    combined = [...combined, ...pr]
  }


  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  notifications.value = combined.slice(0, 10)

  isLoading.value = false
})
</script>

<template>
  <div class="notification-dropdown">
    <div class="dropdown-header">
      <h4>Notifications</h4>
    </div>

    <div v-if="isLoading" class="loading-state">Loading...</div>
    <div v-else-if="notifications.length === 0" class="empty-state">
      No new pledges yet.
    </div>

    <div v-else class="notifications-list">
      <!-- Pass the data down to the individual item component -->
      <NotificationItem
        v-for="notif in notifications"
        :key="notif.id"
        :pledge="notif"
      />
    </div>
  </div>
</template>

<style scoped>
/* Add your dropdown positioning and styling here */
.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 400px;
  overflow-y: auto;
}
.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.empty-state {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>
