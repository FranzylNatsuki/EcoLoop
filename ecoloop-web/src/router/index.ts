import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import Registration from '../views/Registration.vue'
import Profile from '../views/ProfileView.vue'
import Login from '../views/Login.vue'
import PublicProfileView from '../views/PublicProfileView.vue'

// 1. Import the new views (ensure the file paths match where you saved them)
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
      path: '/marketplace/:id',
      name: 'MarketDetail',
      component: () => import('../views/MarketDetailView.vue')
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

    // 2. Add the Forgot Password route
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: { hideHeader: true },
    },

    // 3. Add the Update Password route (must match the Supabase redirect URL)
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
