import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'

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
  ],
})

export default router
