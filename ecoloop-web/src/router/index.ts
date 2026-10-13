import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import Registration from '../views/Registration.vue'
import Profile from '../views/ProfileView.vue'
import Login from '../views/Login.vue'
import PublicProfileView from '../views/PublicProfileView.vue'

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
      component: () => import('../views/MarketplaceView.vue'),
      meta: { hideHeader: false },
    },
    {
      path: '/marketplace/:id',
      name: 'MarketDetail',
      component: () => import('../views/MarketDetailView.vue'),
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

// Automatically handle Vite dynamic import chunk failures (usually caused by new deployments)
router.onError((error, to) => {
  if (error.message.includes('Failed to fetch dynamically imported module') || error.name === 'ChunkLoadError') {
    window.location.href = to.fullPath
  }
})

export default router
