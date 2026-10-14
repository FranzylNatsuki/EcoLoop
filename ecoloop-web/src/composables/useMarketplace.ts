import { ref } from 'vue'
import { supabase } from './useAuth'

    export interface Author {
      full_name: string
      Avatar: string
      score?: number
      is_org?: boolean
      is_verified?: boolean
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
      location_address?: string
      latitude?: number | null
      longitude?: number | null
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
      location_address?: string
      latitude?: number | null
      longitude?: number | null
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
              images:marketplace_listing_images (
                id,
                image_url,
                display_order
              ),
              author:profiles!author_id (
                full_name,
                is_org,
                organization_id,
                profile_data ( Avatar ),
                user_ratings:user_ratings!user_ratings_ratee_id_fkey ( score ),
                organizations!organization_id ( verification_status )
              )
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) throw error

          listings.value = data.map((listing: any) => {
            const rawAuthor = Array.isArray(listing.author) ? listing.author[0] : listing.author
            const rawRatings = rawAuthor?.user_ratings
            const userScore = Array.isArray(rawRatings)
              ? (rawRatings[0]?.score || 0)
              : (rawRatings?.score || 0)

            let isVerified = false
            if (rawAuthor?.is_org && rawAuthor?.organizations) {
              const org = Array.isArray(rawAuthor.organizations) ? rawAuthor.organizations[0] : rawAuthor.organizations
              if (org?.verification_status === 'verified') isVerified = true
            }

            // Ensure images are sorted by their intended order
            const sortedImages = listing.images?.sort(
              (a: any, b: any) => a.display_order - b.display_order
            ) || []

            return {
              ...listing,
              images: sortedImages,
              author: {
                full_name: rawAuthor?.full_name || 'Anonymous User',
                Avatar: rawAuthor?.profile_data?.Avatar || 'https://placehold.co/38x38',
                score: userScore,
                is_org: Boolean(rawAuthor?.is_org),
                is_verified: isVerified
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
              location_address: newListingData.location_address || null,
              latitude: newListingData.latitude || null,
              longitude: newListingData.longitude || null,
              status: 'available'
            })
            .select()
            .single()

          if (insertError) throw insertError

          // Insert images if there are any
          if (newListingData.images && newListingData.images.length > 0) {
            const imageRecords = newListingData.images.map((url, index) => ({
              listing_id: insertedListing.id,
              image_url: url,
              display_order: index
            }))

            const { error: imageError } = await supabase
              .from('marketplace_listing_images')
              .insert(imageRecords)

            if (imageError) {
              console.error('Error saving marketplace images:', imageError)
            }
          }

          await fetchListings()
          return insertedListing
        } catch (err) {
          console.error('Error saving marketplace listing:', err)
          throw err
        }
      }

      return { listings, fetchListings, addListing }
    }
