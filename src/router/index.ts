import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import HomeView from '../views/HomeView.vue'
import StoryView from '../views/StoryView.vue'
import { checkAuth } from '../composables/useAuth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/home', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/signup', component: SignupView },
  { path: '/story/:id', component: StoryView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (to.path === '/home') {
    const isAuthenticated = await checkAuth()
    isAuthenticated ? next() : next('/login')
  } else {
    next()
  }
})

export default router
