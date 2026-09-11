# Eco Loop 
Codebase for EcoLoop website for CCS-6. Full techstack specifications:
* Frontend built in Vue.js and managed with npm
* ASP.net backend
* REST API connection to Database
* AzureSQL
* Azure Web Services Cloud Hosting

## Frontend: ecoloop-web

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

src/ *Contains all web page and component code*
src/components/layout *contains important global components*
* AppHeader.vue - top header bar with search and create post
* CategoryBar.vue - contains pill containers for categories
* PageLayout.vue - defined layout preset vue file
src/components/navigation *navigation presets*
* SidebarNavigation.vue
src/components/posts *homepage posts components*
* CreatePostBar.vue - + Create Post Button
* PostActions.vue - comments, donate, etc.
* PostCard.vue - Post component
* VotePanel.vue - reddit votes ahh
src/components/sidebar *homepage sidebar components*
* CommunityRules.vue - community guidelines
* EventPreview.vue - highlights upcoming event
* TrendingTopics.vue - list of #s

src/views *individual pages*
* HomeView.vue - home page component

### Temporary Backend Fakery
src/data *post card jsons*
