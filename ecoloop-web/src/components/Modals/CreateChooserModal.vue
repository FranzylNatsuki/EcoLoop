    <script setup lang="ts">
    import { ref, watch } from 'vue'
    import { Edit3, Megaphone, Calendar, ChevronRight, X, ShoppingCart } from 'lucide-vue-next'
    import CreateEventModal from './CreateEventModal.vue'
    import CreateCauseModal from './CreatePost.vue'
    import CreateMarketplaceModal from './CreateMarketplaceModal.vue'
    import { usePosts, type CreatePostPayload } from '../../composables/usePosts'
    import { useEvents } from '../../composables/useEvents'
    import { useMarketplace } from '../../composables/useMarketplace'
    import { supabase } from '../../composables/useAuth'

    // Composables
    const { addPost } = usePosts()
    const { createEvent } = useEvents()
    const { addListing } = useMarketplace()

    // Type Guard for Event
    function isEventPayload(payload: unknown): payload is { event: any; materials: any[] } {
      return (
        typeof payload === 'object' &&
        payload !== null &&
        'event' in payload &&
        'materials' in payload
      )
    }

    // Type Guard for Marketplace
    function isMarketplacePayload(payload: unknown): payload is Record<string, any> {
      return payload !== null && typeof payload === 'object' && 'pricingType' in payload
    }

    // Two-way binding for modal open state
    const isOpen = defineModel<boolean>({ default: false })

    // Explicit Emits Declaration
    const emit = defineEmits<{
      (e: 'publish', payload: unknown): void
      (e: 'selectCause'): void
      (e: 'selectEvent'): void
      (e: 'selectMarketplace'): void
    }>()

    // Template Refs & Child Modal Visibility States
    const dialogRef = ref<HTMLDialogElement | null>(null)
    const isEventModalOpen = ref(false)
    const isCauseModalOpen = ref(false)
    const isMarketplaceModalOpen = ref(false)

    // Dialog Visibility Synchronizer
    watch(
      isOpen,
      (open) => {
        if (open) {
          dialogRef.value?.showModal()
        } else {
          dialogRef.value?.close()
        }
      },
      { immediate: true }
    )

    function handleBackdropClick(e: MouseEvent) {
      if (e.target === dialogRef.value) {
        isOpen.value = false
      }
    }

    function handleSelectCause() {
      isOpen.value = false
      isCauseModalOpen.value = true
      emit('selectCause')
    }

    function handleSelectEvent() {
      isOpen.value = false
      isEventModalOpen.value = true
      emit('selectEvent')
    }

    function handleSelectMarketplace() {
      isOpen.value = false
      isMarketplaceModalOpen.value = true
      emit('selectMarketplace')
    }

    async function handlePublish(payload: unknown) {
      if (isEventPayload(payload)) {
        let finalBannerUrl = ''

        if (payload.event.rawFile) {
          const file = payload.event.rawFile
          const filePath = `event-banners/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file)

          if (uploadError) {
            alert('Failed to upload image: ' + uploadError.message)
            return
          }

          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath)

          finalBannerUrl = publicUrlData.publicUrl
        }

        const formattedMaterials = (payload.materials || []).map((m: any) => ({
          material: m.name || m.material_name || m.material || 'Material',
          target: Number(m.target_quantity || m.target || m.quantity || 1),
          current: Number(m.current_quantity || m.current || 0),
          unit: m.unit || 'pcs'
        }))

        const result = await createEvent({
          title: payload.event.title,
          description: payload.event.description,
          category: payload.event.category,
          location: payload.event.location,
          latitude: payload.event.latitude || null,
          longitude: payload.event.longitude || null,
          event_date: `${payload.event.date}T${payload.event.startTime || '00:00'}:00`,
          banner_url: finalBannerUrl,
          materials_needed: formattedMaterials
        })

        if (!result.success) {
          alert('Failed to post event: ' + result.error)
          return
        }
      } else if (isMarketplacePayload(payload)) {
        // 1. Upload Marketplace Images to Supabase Storage
        const imageUrls: string[] = []
        if (payload.images && Array.isArray(payload.images)) {
          for (const file of payload.images) {
            const filePath = `marketplace/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(filePath, file)

            if (uploadError) {
              console.error("Failed to upload image:", uploadError)
              alert('Failed to upload an image. Continuing with the rest.')
              continue
            }

            const { data: publicUrlData } = supabase.storage
              .from('images')
              .getPublicUrl(filePath)

            imageUrls.push(publicUrlData.publicUrl)
          }
        }

        // 2. Format Payload (convert camelCase from modal to snake_case for DB)
        const formattedPayload = {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          pricing_type: payload.pricingType,
          pricing_structure: payload.pricingStructure,
          price: payload.price,
          quantity: payload.quantity,
          quantity_unit: payload.quantityUnit,
          location_address: payload.location_address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          images: imageUrls
        }

        try {
          await addListing(formattedPayload as any)
        } catch (err) {
          alert('Failed to post listing: ' + (err as Error).message)
          return
        }
      } else {
        // Handling standard posts...
        await addPost(payload as CreatePostPayload)
      }

      // Close all modals after successful publish
      isCauseModalOpen.value = false
      isEventModalOpen.value = false
      isMarketplaceModalOpen.value = false

      emit('publish', payload)
    }
  </script>

    <template>
      <Teleport to="body">
        <dialog
          ref="dialogRef"
          class="modal-backdrop"
          @cancel="isOpen = false"
          @click="handleBackdropClick"
        >
          <div class="chooser-card">
            <!-- Header -->
            <div class="header-row">
              <div class="title-group">
                <div class="icon-container header-icon">
                  <Edit3 :size="20" color="#778732" />
                </div>
                <h2 class="header-title">Create New</h2>
              </div>
              <button type="button" class="btn-close" @click="isOpen = false">
                <X :size="14" color="#1A1D1A" />
              </button>
            </div>

            <div class="header-divider"></div>

            <!-- Options Stack -->
            <div class="options-stack">
              <!-- Cause Request Post -->
              <button type="button" class="selection-card" @click="handleSelectCause">
                <div class="icon-container option-icon">
                  <Megaphone :size="20" color="#778732" />
                </div>
                <div class="card-text-block">
                  <span class="card-title">Cause Request Post</span>
                  <span class="card-description">
                    Share a request for materials, resources, or help with your recycling project
                  </span>
                </div>
                <ChevronRight :size="16" class="chevron-icon" />
              </button>

              <!-- Event Post -->
              <button type="button" class="selection-card" @click="handleSelectEvent">
                <div class="icon-container option-icon">
                  <Calendar :size="20" color="#778732" />
                </div>
                <div class="card-text-block">
                  <span class="card-title">Event</span>
                  <span class="card-description">
                    Organize a community clean-up, workshop, or recycling drive
                  </span>
                </div>
                <ChevronRight :size="16" class="chevron-icon" />
              </button>

              <!-- Marketplace Listing -->
              <button type="button" class="selection-card" @click="handleSelectMarketplace">
                <div class="icon-container option-icon">
                  <ShoppingCart :size="20" color="#778732" />
                </div>
                <div class="card-text-block">
                  <span class="card-title">Marketplace Listing</span>
                  <span class="card-description">
                    Sell or donate recyclable materials like plastics, glass, or electronics
                  </span>
                </div>
                <ChevronRight :size="16" class="chevron-icon" />
              </button>
            </div>

            <!-- Cancel Footer -->
            <button type="button" class="btn-cancel" @click="isOpen = false">
              Cancel
            </button>
          </div>
        </dialog>
      </Teleport>

      <!-- Next Steps in Chain -->
      <CreateCauseModal
        v-model="isCauseModalOpen"
        @publish="handlePublish"
      />

      <CreateEventModal
        v-model="isEventModalOpen"
        @publish="handlePublish"
      />

      <CreateMarketplaceModal
        v-model="isMarketplaceModalOpen"
        @publish="handlePublish"
      />
    </template>

    <style scoped>
    .modal-backdrop {
      border: none;
      padding: 0;
      background: transparent;
      max-width: 100vw;
      max-height: 100vh;
    }

    .modal-backdrop::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }

    .chooser-card {
      width: 540px;
      padding: 28px;
      background: #ffffff;
      box-shadow: 0px 16px 40px rgba(26, 29, 26, 0.15);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-sizing: border-box;
    }

    .header-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(119, 135, 50, 0.10);
      flex-shrink: 0;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
    }

    .header-title {
      margin: 0;
      color: #1A1D1A;
      font-size: 22px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      line-height: 1.2;
    }

    .btn-close {
      width: 32px;
      height: 32px;
      background: #F7F8F6;
      border: none;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-close:hover {
      background: #E4E7E3;
    }

    .header-divider {
      width: 100%;
      height: 1px;
      background-color: #E4E7E3;
    }

    .options-stack {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .selection-card {
      width: 100%;
      padding: 16px;
      background: #ffffff;
      border-radius: 12px;
      border: 1.5px solid #E4E7E3;
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;
      box-sizing: border-box;
    }

    .selection-card:hover {
      border-color: #778732;
      background: #F7F8F6;
      transform: translateY(-1px);
    }

    .selection-card:hover .chevron-icon {
      color: #778732;
    }

    .option-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .card-text-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .card-title {
      color: #1A1D1A;
      font-size: 16px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
    }

    .card-description {
      color: #8F9A8F;
      font-size: 13px;
      font-family: 'Geist', sans-serif;
      font-weight: 400;
      line-height: 1.4;
    }

    .chevron-icon {
      color: #8F9A8F;
      transition: color 0.2s ease;
      flex-shrink: 0;
    }

    .btn-cancel {
      width: 100%;
      background: transparent;
      border: none;
      padding-top: 8px;
      color: #8F9A8F;
      font-size: 14px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
      text-align: center;
    }

    .btn-cancel:hover {
      color: #1A1D1A;
    }
    </style>
