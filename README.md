# EcoLoop

CCS6 Sourcecode

Codebase for EcoLoop website for CCS-6. Full techstack specifications:
* Frontend built in Vue.js and managed with npm
* ASP.net C# backend
* Supabase DBMs
* Supabase File Storage
* MonsterASP backend hosting
* Vercel / Cloudflare pages Vue Server

## Frontend: ecoloop-web

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

3. run in dev mode and copy paste link (Localhost)
```bash
npm run dev
```

### File System

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
* VotePanel.vue - reddit votes ahh

`src/components/sidebar` *homepage sidebar components*
* CommunityRules.vue - community guidelines
* EventPreview.vue - highlights upcoming event
* TrendingTopics.vue - list of #'s events

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

`src/views` *individual pages*
* HomeView.vue - home page component
* EventsView.vue - events page component

`src/assets` *contains logos / images*

`src/types` *object type definitions*



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

### Temporary Backend Fakery
`src/data` contains fake json data to showcase modularity for itemized components.

test
