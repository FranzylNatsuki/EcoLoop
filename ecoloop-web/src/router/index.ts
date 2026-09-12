import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'

const router = createRouter({
  history: createWebHistory(),

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
})

export default router
