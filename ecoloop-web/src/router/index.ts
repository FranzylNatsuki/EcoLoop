import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
// import MarketplaceView from '../views/MarketplaceView.vue' // 1. Uncommented this
import PostDetailView from '../views/PostDetailView.vue'
import Registration from '../views/Registration.vue'
import Profile from '../views/ProfileView.vue'
import Login from '../views/Login.vue'
import PublicProfileView from '../views/PublicProfileView.vue'

// Import the new views
import ForgotPassword from '../views/ForgotPassword.vue'
import UpdatePassword from '../views/UpdatePassword.vue'

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
      path: '/events/:id?',
      name: 'event-detail',
      component: EventsView,
      meta: { hideHeader: false },
    },

    // Replace your unified marketplace route with these TWO routes:

        {
          path: '/marketplace',
          name: 'marketplace',
          component: () => import('../views/MarketplaceView.vue'), // The Grid View
          meta: { hideHeader: false },
        },
        {
          path: '/marketplace/:id',
          name: 'MarketDetail',
          component: () => import('../views/MarketDetailView.vue'), // The Full Detail Page
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
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: { hideHeader: true },
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: UpdatePassword,
      meta: { hideHeader: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
    },
    {
      path: '/user/:id',
      name: 'public-profile',
      component: PublicProfileView,
    },
    {
      path: '/pledge/:id',
      name: 'pledgedetail',
      component: () => import('../views/PledgeDetailView.vue'),
    },
  ],
})

export default router
