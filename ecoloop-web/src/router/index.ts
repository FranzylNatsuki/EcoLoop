import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import Registration from '../views/Registration.vue'
import Profile from '../views/ProfileView.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { hideHeader: false },
    },
    {
      path: '/',
      name: 'root',
      component: Login,
      meta: { hideHeader: true },
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: EventsView,
      meta: { hideHeader: false },
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: MarketplaceView,
      meta: { hideHeader: false },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: PostDetailView,
      meta: { hideHeader: false },
    },
    {
      path: '/register',
      name: 'register',
      component: Registration,
      meta: { hideHeader: true },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { hideHeader: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
    }
  ],
})

export default router
