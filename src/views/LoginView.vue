<template>
  <div class="login-page">
    <section class="login-panel">
      <div class="brand">
        <span class="brand-mark">B</span>
        <div>
          <h1>Banking App</h1>
          <p>{{ isRegistering ? 'Create your account' : 'Sign in to continue' }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <label>
          Username
          <input v-model="username" type="text" autocomplete="username" required />
        </label>

        <label>
          Password
          <input
            v-model="password"
            type="password"
            :autocomplete="isRegistering ? 'new-password' : 'current-password'"
            minlength="6"
            required
          />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Please wait' : isRegistering ? 'Create account' : 'Login' }}
        </button>
      </form>

      <button class="mode-button" type="button" @click="toggleMode">
        {{ isRegistering ? 'Use an existing account' : 'Create a new account' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isRegistering = ref(false)
const isLoading = ref(false)

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    const endpoint = isRegistering.value ? '/auth/register' : '/auth/login'
    const response = await api.post(endpoint, {
      username: username.value,
      password: password.value,
    })

    // Store token, role, and username from the new JWT response
    userStore.setToken(response.data.token, response.data.role, response.data.username)

    // Route based on role
    if (response.data.role === 'EMPLOYEE') {
      router.push('/employee-dashboard')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    console.error('Auth request failed', err.response || err)

    if (!err.response) {
      error.value = 'Cannot reach backend at http://localhost:8090'
    } else {
      error.value =
        err.response.data?.message ||
        err.response.data?.error ||
        `${isRegistering.value ? 'Create account' : 'Login'} failed (${err.response.status})`
    }
  } finally {
    isLoading.value = false
  }
}

function toggleMode() {
  isRegistering.value = !isRegistering.value
  error.value = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(140deg, rgba(20, 65, 92, 0.86), rgba(18, 102, 96, 0.72)),
    url('@/assets/hero.png') center / cover;
  padding: 24px;
}

.login-panel {
  width: min(100%, 420px);
  padding: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 70px rgba(4, 24, 34, 0.24);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  background: #126660;
  color: white;
  font-weight: 800;
}

h1,
p {
  margin: 0;
}

h1 {
  color: #14323f;
  font-size: 1.65rem;
}

.brand p {
  color: #5b6b72;
  margin-top: 4px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  color: #243942;
  font-size: 0.92rem;
  font-weight: 650;
}

input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #c9d4d8;
  border-radius: 6px;
  padding: 0.8rem 0.85rem;
  font-size: 1rem;
  color: #14323f;
  background: white;
}

input:focus {
  outline: 3px solid rgba(18, 102, 96, 0.18);
  border-color: #126660;
}

button {
  border: 0;
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 750;
  cursor: pointer;
  color: white;
  background: #126660;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.mode-button {
  width: 100%;
  margin-top: 14px;
  color: #126660;
  background: transparent;
}

.error {
  color: #b42318;
  margin: 0;
  font-size: 0.92rem;
}
</style>
