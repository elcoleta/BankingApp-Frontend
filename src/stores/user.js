import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || null)
  const status = ref(localStorage.getItem('userStatus') || null)
  const role = ref(localStorage.getItem('userRole') || null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isPending = computed(() => status.value === 'PENDING')
  const isApproved = computed(() => status.value === 'APPROVED')
  const isEmployee = computed(() => role.value === 'EMPLOYEE')
  const isCustomer = computed(() => role.value === 'CUSTOMER')

  function setSession(newToken, newStatus, newRole) {
    token.value = newToken
    status.value = newStatus
    role.value = newRole
    localStorage.setItem('token', newToken)
    localStorage.setItem('userStatus', newStatus)
    localStorage.setItem('userRole', newRole)
  }

  function logout() {
    token.value = null
    status.value = null
    role.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userStatus')
    localStorage.removeItem('userRole')
  }

  return { token, status, role, user, isLoggedIn, isPending, isApproved, isEmployee, isCustomer, setSession, logout }
})
