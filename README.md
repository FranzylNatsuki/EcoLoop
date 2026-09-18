# EcoLoop

CCS6 Sourcecode

Codebase for EcoLoop website for CCS-6. Full techstack specifications:
* Frontend built in Vue.js and managed with npm
* ASP.net C# backend
* Supabase DBMs
* Supabase File Storage
* MonsterASP backend hosting
* Vercel / Cloudflare pages Vue Server

### Figma
*Based on*:
https://www.figma.com/design/PKSdF5zZNxwBqm1AotJfBJ/EcoLoo?node-id=1-1255&t=J2YowMGp3bxCLtYy-1 

### How to run

1. first go inside ecoloop-web folder
```bash
cd ecoloop-web
```

2. install npm (if you haven't yet)
```bash
npm install
```

3. run the json posts updater service
```bash
npx json-server --port 3001 src/data/db.json
```

4. run in dev mode and copy paste link (Localhost)
```bash
npm run dev
```

5. Open another terminal, return to the base folder and transfer to EcoLoop.Api
```bash
cd EcoLoop.Api
```

6. Build and run C# server
```bash
dotnet build
dotnet run
```

### Important Files.

If this is your first time importing the project please create an .env file in `EcoLoop/ecoloop-web/.env`

it should contain this code: [Replace with actual keys]
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=[insertkeyhere]
```

## Frontend: ecoloop-web

### File System Vue

`src/` *Contains all web page and component code*

`src/components/layout` *contains important global components*

* AppHeader.vue - top header bar with search and create post
* CategoryBar.vue - contains pill containers for categories
* PageLayout.vue - defined layout preset vue file
* SeeEventsButton.vue  
* CreatePostButton.vue

`src/components/navigation` *navigation presets*
* SidebarNavigation.vue

`src/components/posts` *homepage posts components*
* CreatePostBar.vue - + Create Post Button
* PostActions.vue - comments, donate, etc.
* PostCard.vue - Post component
* EventCard.vue - Event component card
* VotePanel.vue - reddit votes ahh
* PostCommentItem.vue
* PostCommentSection.vue
* PostDetailHeader.vue
* PostMaterialItem.vue
* PostMaterialList.vue

`src/components/sidebar` *homepage sidebar components*
* CommunityRules.vue - community guidelines
* EventPreview.vue - highlights upcoming event
* TrendingTopics.vue - list of #'s events
* AuthorCard.vue
* RelatedPosts.vue
* SavedProjectsCard.vue
* TrendingTopics.vue

`src/components/events` *event page contents*
* AboutProjectCard.vue
* CampaignOrganizerCard.vue
* DonorsLeaderbord.vue
* EventHero.vue
* EventStats.vue
* MaterialRow.vue
* MaterialsNeededCard.vue
* ProjectLocationCard.vue
* RecentDonationsCard.vue
* RelatedEventsCard.vue

`src/components/marketplace` *marketplace contents*
* MarketplaceCard.vue - item container
* Popular CategoriesCard.vue

`src/components/Modals` *dialogue boxes*
* CreatePost.vue
* DonateMaterialsModals.vue
* CreateEventModal.vue
* CreateChooserModal.vue
* RequestMaterialsModal.vue
* ThankYouDonationModal.vue
* EditProfileModal.vue

`src/views` *individual pages*
* HomeView.vue - home page component
* EventsView.vue - events page component
* MarketplaceView.vue - marketplace page
* PostDetailView.vue - enlarged posts once clicked
* ProfileView.vue
* Login.vue
* Registration.vue

`src/assets` *contains logos / images*

`src/types` *object type definitions*

`src/composables` *contains engine for json read / write*
* usePosts.ts
* useEvents.ts
* useAuth.ts

### Router (IMPORTANT!)
Router defines the locators for the view controller (which page is loaded, refer to examples of how `<RouterLink to="">` is used in my examples e.g.: `CreatePostButton.vu`). *New Pages* require to be defined in the router and must be addressed using RouterLink as href. It is located in `src/router`. Edit `index.ts`.

This contains the list of views:
```javascript
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/',
      name: 'root',
      component:HomeView,
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView,
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: MarketplaceView,
    },
  ],
```

`path` is NOT the actual directory but what you write for the address when using `<RouterLink to="">` code. Name is a defined identifier, component is the vue file name but without the file extension.

### How Session Authentication Works

Our application uses **JSON Web Tokens (JWT)** managed by Supabase for secure, stateless session management across the Vue frontend, ASP.NET backend, and PostgreSQL database.

1. **Token Generation:** When a user logs in, Supabase Auth verifies their credentials and issues a secure JWT containing their unique identifier (`uid`).
2. **Local Persistence:** The `@supabase/supabase-js` client automatically caches this token in the browser's local storage. This keeps the user logged in even if they refresh or close the page.
3. **Direct Database Access (RLS):** When the Vue frontend queries Supabase directly (e.g., fetching a profile), the JS client automatically attaches the token to the request. PostgreSQL intercepts this token and uses Row Level Security (RLS) policies to verify `auth.uid()` before allowing any `SELECT` or `UPDATE` actions.
4. **C# Backend Access:** When the frontend needs to communicate with our ASP.NET API, it attaches the JWT to the HTTP request in the `Authorization: Bearer <token>` header. The C# middleware validates the token's cryptographic signature using our Supabase project secret before granting access to protected endpoints.

Example Template of Session Token Access:
```typescript
import { supabase } from '../composables/useAuth'

const fetchUserItems = async () => {
  // 1. Grab the guaranteed current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // 2. Stop the function if they aren't logged in
  if (sessionError || !session) {
    console.warn("Unauthorized: No active session.")
    return
  }

  // 3. Extract the universally unique identifier (UUID)
  const userId = session.user.id

  // 4. Run your database query using that ID
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', userId) // <-- Bind the query to the user!

  if (error) {
    console.error("Failed to fetch data:", error.message)
    return
  }

  console.log("User data retrieved:", data)
}
```

### Temporary Backend Fakery
`src/data` contains fake json data to showcase modularity for itemized components.
* mockPosts.json
* userData.json
* eventData.json
* mockMarketplace.json

### File System C#

`Controllers/`
`obj/`
`Properties/`
`appsettings.json/`
`appsettings.Development.json/`
`EcoLoop.Api.csproj/`
`EcoLoop.Api.http/`
`Program.cs`

### Supabase x C#

1.

```bash
dotnet user-secrets set "Supabase:Url" "https://xxxx.supabase.co"
```

2.

```bash
dotnet user-secrets set "Supabase:SecretKey" "xxxx"
```

3.

```bash
dotnet user-secrets set "ConnectionStrings:Supabase" "Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Username=postgres.vqxfmwbuwbafxubinmyw;Password=[REDACTED];Database=postgres"
```
