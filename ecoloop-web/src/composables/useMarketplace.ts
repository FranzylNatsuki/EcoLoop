import { ref, onMounted } from 'vue'
import { supabase } from './useAuth'

export interface Author {
  full_name: string
  Avatar: string
  score?: number
}

export interface MarketplaceImage {
  id?: string
  listing_id?: string
  image_url: string
  display_order: number
}

export interface MarketplaceListing {
  id: string
  author_id: string
  title: string
  description: string
  category: 'Plastics' | 'Glass' | 'Paper/Cardboard' | 'Metal' | 'Electronics'
  post_type: string
  pricing_type: 'For Sale' | 'Free/Donation'
  pricing_structure: 'Per Unit / kg' | 'Bulk Bundle (e.g., per 20 pcs)' | 'Total Lot Price (Price for All)'
  price: number | null
  quantity: number | null
  quantity_unit: 'pcs' | 'kg' | 'items' | 'lots'
  status: 'available' | 'sold' | 'archived'
  location_address?: string // New
  latitude?: number | null  // New
  longitude?: number | null // New
  created_at: string
  updated_at: string
  author: Author
  images?: MarketplaceImage[]
}

export interface CreateMarketplacePayload {
  title: string
  description: string
  category: string
  pricing_type: 'For Sale' | 'Free/Donation'
  pricing_structure: 'Per Unit / kg' | 'Bulk Bundle (e.g., per 20 pcs)' | 'Total Lot Price (Price for All)'
  price: number | null
  quantity: number | null
  quantity_unit: 'pcs' | 'kg' | 'items' | 'lots'
  location_address?: string // New
  latitude?: number | null  // New
  longitude?: number | null // New
  images?: string[]
}

const listings = ref<MarketplaceListing[]>([])

export function useMarketplace() {
  async function fetchListings() {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data ( Avatar ),
            user_ratings:user_ratings!user_ratings_ratee_id_fkey ( score )
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (error) throw error

      listings.value = data.map((listing: any) => {
        const rawRatings = listing.author?.user_ratings
        const userScore = Array.isArray(rawRatings)
          ? (rawRatings[0]?.score || 0)
          : (rawRatings?.score || 0)

        return {
          ...listing,
          author: {
            full_name: listing.author?.full_name || 'Anonymous User',
            Avatar: listing.author?.profile_data?.Avatar || 'https://placehold.co/38x38',
            score: userScore
          }
        }
      }) as MarketplaceListing[]
    } catch (err) {
      console.error('Error fetching marketplace listings:', err)
    }
  }

  async function addListing(newListingData: CreateMarketplacePayload) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn('Unauthorized: Must be logged in to post a listing.')
        return
      }

      const finalPrice = newListingData.pricing_type === 'Free/Donation' ? null : newListingData.price

      const { data: insertedListing, error: insertError } = await supabase
        .from('marketplace_listings')
        .insert({
          author_id: session.user.id,
          title: newListingData.title,
          description: newListingData.description,
          category: newListingData.category,
          post_type: 'marketplace',
          pricing_type: newListingData.pricing_type,
          pricing_structure: newListingData.pricing_structure,
          price: finalPrice,
          quantity: newListingData.quantity,
          quantity_unit: newListingData.quantity_unit,
          location_address: newListingData.location_address || null, // New
          latitude: newListingData.latitude || null,                 // New
          longitude: newListingData.longitude || null,               // New
          status: 'available'
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchListings()
      return insertedListing
    } catch (err) {
      console.error('Error saving marketplace listing:', err)
      throw err
    }
  }

  onMounted(() => {
    if (listings.value.length === 0) fetchListings()
  })

  return { listings, fetchListings, addListing }
}
