import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import PendingView from '@/views/PendingView.vue'
import EmployeeDashboardView from '@/views/EmployeeDashboardView.vue'
import EmployeeCustomersView from '@/views/EmployeeCustomersView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/pending', component: PendingView, meta: { requiresAuth: true } },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true, requiresApproved: true } },
  { path: '/transactions', component: TransactionsView, meta: { requiresAuth: true, requiresApproved: true } },
  { path: '/employee/dashboard', component: EmployeeDashboardView, meta: { requiresAuth: true, requiresEmployee: true } },
  { path: '/employee/customers', component: EmployeeCustomersView, meta: { requiresAuth: true, requiresEmployee: true } },
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

  if (to.meta.requiresEmployee && !userStore.isEmployee) {
    return next('/login')
  }

  if (to.meta.requiresApproved && userStore.isPending) {
    return next('/pending')
  }

  if (to.path === '/pending' && userStore.isApproved) {
    return next('/dashboard')
  }

  next()
})

export default router
