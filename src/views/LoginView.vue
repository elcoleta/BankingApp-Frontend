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

      <!-- Success message after registration -->
      <div v-if="registered" class="success-banner">
        Registration successful! Your account is pending employee approval. You can log in once approved.
      </div>

      <form v-if="!registered" @submit.prevent="handleSubmit">
        <!-- Registration-only fields -->
        <template v-if="isRegistering">
          <div class="row-2">
            <label>
              First name
              <input v-model="firstName" type="text" autocomplete="given-name" required />
            </label>
            <label>
              Last name
              <input v-model="lastName" type="text" autocomplete="family-name" required />
            </label>
          </div>

          <label>
            BSN
            <input
              v-model="bsn"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="9-digit number"
              pattern="\d{9}"
              title="BSN must be exactly 9 digits"
              required
            />
          </label>

          <label>
            Phone number
            <input v-model="phoneNumber" type="tel" autocomplete="tel" required />
          </label>
        </template>

        <!-- Shared fields -->
        <label>
          Email address
          <input v-model="email" type="email" autocomplete="email" required />
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
          {{ isLoading ? 'Please wait…' : isRegistering ? 'Create account' : 'Login' }}
        </button>
      </form>

      <button class="mode-button" type="button" @click="toggleMode">
        {{ isRegistering ? 'Already have an account? Sign in' : registered ? 'Sign in to your account' : 'Create a new account' }}
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

const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const bsn = ref('')
const phoneNumber = ref('')
const error = ref('')
const isRegistering = ref(false)
const isLoading = ref(false)
const registered = ref(false)

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    if (isRegistering.value) {
      await api.post('/auth/register', {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        bsn: bsn.value.trim(),
        phoneNumber: phoneNumber.value.trim(),
        password: password.value,
      })
      registered.value = true
      isRegistering.value = false
    } else {
      const response = await api.post('/auth/login', {
        email: email.value.trim(),
        password: password.value,
      })
      userStore.setSession(response.data.token, response.data.status, response.data.role)

      if (response.data.role === 'EMPLOYEE') {
        router.push('/employee/dashboard')
      } else if (response.data.status === 'APPROVED') {
        router.push('/dashboard')
      } else {
        router.push('/pending')
      }
    }
  } catch (err) {
    if (!err.response) {
      error.value = 'Cannot reach backend at http://localhost:8090'
    } else if (err.response.status === 409 || err.response.status === 401) {
      error.value = err.response.data?.message || 'Request failed'
    } else {
      error.value =
        err.response.data?.message ||
        `${isRegistering.value ? 'Registration' : 'Login'} failed (${err.response.status})`
    }
  } finally {
    isLoading.value = false
  }
}

function toggleMode() {
  if (registered.value) {
    // coming from success banner — go to login, don't toggle to register
    registered.value = false
    isRegistering.value = false
  } else {
    isRegistering.value = !isRegistering.value
  }
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
  width: min(100%, 480px);
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
  flex-shrink: 0;
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

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
  padding: 10px 12px;
  background: #fff1f0;
  border: 1px solid #ffc9c9;
  border-radius: 6px;
}

.success-banner {
  color: #0d6640;
  font-size: 0.92rem;
  padding: 12px 14px;
  background: #f0fff8;
  border: 1px solid #b2e5cc;
  border-radius: 6px;
  margin-bottom: 16px;
  line-height: 1.5;
}
</style>
