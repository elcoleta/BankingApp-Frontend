import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const role = ref(localStorage.getItem('role') || null)
  const username = ref(localStorage.getItem('username') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isEmployee = computed(() => role.value === 'EMPLOYEE')

  function setToken(newToken, newRole, newUsername) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    if (newRole) {
      role.value = newRole
      localStorage.setItem('role', newRole)
    }
    if (newUsername) {
      username.value = newUsername
      localStorage.setItem('username', newUsername)
    }
  }

  function logout() {
    token.value = null
    user.value = null
    role.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
  }

  return { token, user, role, username, isLoggedIn, isEmployee, setToken, logout }
})
