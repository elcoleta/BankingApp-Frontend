import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import TransferView from '@/views/TransferView.vue'
import AtmView from '@/views/AtmView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/transactions', component: TransactionsView, meta: { requiresAuth: true } },
  { path: '/transfer', component: TransferView, meta: { requiresAuth: true } },
  { path: '/atm', component: AtmView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return next('/login')
  }
  next()
})

export default router