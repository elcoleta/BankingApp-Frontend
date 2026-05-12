<template>
  <main class="dashboard">

    <!-- Header -->
    <header>
      <div>
        <p class="eyebrow">Banking App</p>
        <h1>Welcome{{ username ? `, ${username}` : '' }}</h1>
      </div>
      <button type="button" @click="handleLogout">Logout</button>
    </header>

    <!-- Accounts section -->
    <section class="section">
      <h2>My Accounts</h2>

      <p v-if="loading">Loading accounts…</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <div v-else class="accounts-grid">
        <div v-for="account in accounts" :key="account.id" class="account-card">
          <div class="account-top">
            <span class="account-type">{{ account.accountType }}</span>
            <span :class="['account-status', account.active ? 'active' : 'inactive']">
              {{ account.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="iban">{{ account.iban }}</p>
          <p class="balance">€ {{ account.balance.toFixed(2) }}</p>
        </div>
      </div>
    </section>

  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const accounts = ref([])
const loading = ref(true)
const error = ref('')

// Runs once when the page loads
onMounted(async () => {
  try {
    // 1. Get the logged-in user's name
    const meResponse = await api.get('/api/me')
    username.value = meResponse.data.username

    // 2. Get the user's accounts
    const accountsResponse = await api.get('/accounts/my')
    accounts.value = accountsResponse.data
  } catch (err) {
    if (err.response?.status === 401) {
      // Token expired or invalid → send back to login
      userStore.logout()
      router.push('/login')
    } else {
      error.value = 'Could not load accounts. Is the backend running?'
    }
  } finally {
    loading.value = false
  }
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f4f7f8;
  color: #14323f;
  padding: 32px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 920px;
  margin: 0 auto 32px;
}

.eyebrow {
  color: #126660;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
}

h1 {
  font-size: 2rem;
  margin: 4px 0 0;
}

button {
  border: 0;
  border-radius: 6px;
  padding: 0.72rem 1.2rem;
  color: white;
  background: #126660;
  font-weight: 700;
  cursor: pointer;
}

/* Section wrapper */
.section {
  max-width: 920px;
  margin: 0 auto;
}

h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 16px;
  color: #14323f;
}

/* Account cards grid */
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.account-card {
  background: white;
  border: 1px solid #dce5e8;
  border-radius: 10px;
  padding: 20px;
}

.account-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.account-type {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #126660;
  letter-spacing: 0.05em;
}

.account-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
}

.active {
  background: #dcfce7;
  color: #15803d;
}

.inactive {
  background: #fee2e2;
  color: #b91c1c;
}

.iban {
  font-size: 0.88rem;
  color: #5b6b72;
  margin: 0 0 14px;
  letter-spacing: 0.02em;
}

.balance {
  font-size: 1.6rem;
  font-weight: 800;
  color: #14323f;
  margin: 0;
}

.error {
  color: #b42318;
}
</style>
