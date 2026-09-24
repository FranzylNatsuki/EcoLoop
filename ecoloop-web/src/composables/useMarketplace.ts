import { ref, onMounted } from 'vue'
import { supabase } from './useAuth'

// 1. Interfaces tailored to public.marketplace_listings schema
export interface Author {
  full_name: string
  Avatar: string
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
  images?: string[] // Array of image URLs uploaded prior to calling addListing
}

const listings = ref<MarketplaceListing[]>([])

export function useMarketplace() {
  // 2. Fetch Marketplace Listings with Relational Joins
  async function fetchListings() {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            profile_data ( Avatar )
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (error) throw error

      listings.value = data.map((listing: any) => ({
        ...listing,
        author: {
          full_name: listing.author?.full_name || 'Anonymous User',
          Avatar: listing.author?.profile_data?.Avatar || 'https://placehold.co/38x38'
        }
      })) as MarketplaceListing[]
    } catch (err) {
      console.error('Error fetching marketplace listings from Supabase:', err)
    }
  }

  // 3. Add New Marketplace Listing
  async function addListing(newListingData: CreateMarketplacePayload) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn('Unauthorized: Must be logged in to post a listing.')
        return
      }

      const userId = session.user.id

      // Enforce DB constraint rule: Free items must have a null price
      const finalPrice = newListingData.pricing_type === 'Free/Donation'
        ? null
        : newListingData.price

      // Step A: Insert into marketplace_listings
      const { data: insertedListing, error: insertError } = await supabase
        .from('marketplace_listings')
        .insert({
          author_id: userId,
          title: newListingData.title,
          description: newListingData.description,
          category: newListingData.category,
          post_type: 'marketplace',
          pricing_type: newListingData.pricing_type,
          pricing_structure: newListingData.pricing_structure,
          price: finalPrice,
          quantity: newListingData.quantity,
          quantity_unit: newListingData.quantity_unit,
          status: 'available'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Step B: Image handling
      if (newListingData.images && newListingData.images.length > 0) {
        console.log('Images received for listing:', newListingData.images)
        // TODO: Insert images into storage or image table when ready

        // Optional step depending on if you have a separate marketplace_images table:
        // await supabase.from('marketplace_images').insert(imageInserts)
      }

      // Step C: Refresh local state to immediately update UI
      await fetchListings()

      return insertedListing
    } catch (err) {
      console.error('Error saving marketplace listing to Supabase:', err)
      throw err
    }
  }

  onMounted(() => {
    if (listings.value.length === 0) {
      fetchListings()
    }
  })

  return {
    listings,
    fetchListings,
    addListing
  }
}
