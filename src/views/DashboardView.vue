<template>
  <div class="layout">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-name">BankApp</span>
      </div>
      <nav>
        <a class="nav-item active" href="#">
          <span class="nav-icon">⊞</span> Dashboard
        </a>
        <a class="nav-item" href="#">
          <span class="nav-icon">↕</span> Transactions
        </a>
        <a class="nav-item" href="#">
          <span class="nav-icon">➜</span> Transfer
        </a>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <!-- Main content -->
    <main class="main">

      <!-- Top bar -->
      <header class="topbar">
        <div>
          <p class="greeting">Good day,</p>
          <h1>{{ username || '…' }}</h1>
        </div>
      </header>

      <!-- Loading / error -->
      <p v-if="loading" class="status-msg">Loading your accounts…</p>
      <p v-else-if="error" class="status-msg error">{{ error }}</p>

      <template v-else>

        <!-- Total balance banner -->
        <div class="balance-banner">
          <div>
            <p class="banner-label">Total Balance</p>
            <p class="banner-amount">€ {{ totalBalance }}</p>
          </div>
          <div class="banner-right">
            <p class="banner-label">Accounts</p>
            <p class="banner-count">{{ accounts.length }}</p>
          </div>
        </div>

        <!-- Account cards -->
        <h2 class="section-title">My Accounts</h2>
        <div class="cards-grid">
          <div
            v-for="account in accounts"
            :key="account.id"
            class="account-card"
            :class="account.accountType.toLowerCase()"
          >
            <div class="card-header">
              <span class="card-type">{{ account.accountType }}</span>
              <span class="card-status">● Active</span>
            </div>
            <p class="card-iban">{{ account.iban }}</p>
            <p class="card-balance">€ {{ account.balance.toFixed(2) }}</p>
            <div class="card-footer">
              <span>Daily limit: € {{ account.dailyTransferLimit.toFixed(0) }}</span>
            </div>
          </div>
        </div>

      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const accounts = ref([])
const loading = ref(true)
const error = ref('')

const totalBalance = computed(() =>
  accounts.value.reduce((sum, a) => sum + a.balance, 0).toFixed(2)
)

onMounted(async () => {
  try {
    const meResponse = await api.get('/api/me')
    username.value = meResponse.data.username

    const accountsResponse = await api.get('/accounts/my')
    accounts.value = accountsResponse.data
  } catch (err) {
    if (err.response?.status === 401) {
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
/* ── Layout ─────────────────────────────────── */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f0f4f8;
  font-family: system-ui, sans-serif;
}

/* ── Sidebar ─────────────────────────────────── */
.sidebar {
  width: 220px;
  background: #0d2b36;
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  padding: 0 8px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #126660;
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  display: grid;
  place-items: center;
}

.logo-name {
  color: white;
  font-weight: 700;
  font-size: 1.05rem;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #8faab5;
  font-size: 0.92rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: white;
}

.nav-item.active {
  background: #126660;
  color: white;
}

.nav-icon {
  font-size: 1rem;
  width: 18px;
  text-align: center;
}

.logout-btn {
  margin-top: auto;
  background: rgba(255,255,255,0.07);
  border: none;
  color: #8faab5;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.13);
  color: white;
}

/* ── Main area ───────────────────────────────── */
.main {
  flex: 1;
  padding: 36px 40px;
  overflow-y: auto;
}

.topbar {
  margin-bottom: 28px;
}

.greeting {
  margin: 0;
  color: #6b8796;
  font-size: 0.88rem;
}

h1 {
  margin: 4px 0 0;
  font-size: 1.9rem;
  color: #0d2b36;
}

/* ── Total balance banner ────────────────────── */
.balance-banner {
  background: linear-gradient(135deg, #126660, #0d4a44);
  border-radius: 14px;
  padding: 28px 32px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
}

.banner-label {
  margin: 0 0 6px;
  font-size: 0.82rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.banner-amount {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.banner-right {
  text-align: right;
}

.banner-count {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

/* ── Section title ───────────────────────────── */
.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0d2b36;
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Account cards ───────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.account-card {
  background: white;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(13, 43, 54, 0.07);
  border-top: 4px solid #126660;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.account-card.savings {
  border-top-color: #0d7a6e;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-type {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #126660;
}

.card-status {
  font-size: 0.75rem;
  color: #16a34a;
  font-weight: 600;
}

.card-iban {
  margin: 0;
  font-size: 0.85rem;
  color: #6b8796;
  letter-spacing: 0.04em;
}

.card-balance {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 800;
  color: #0d2b36;
  letter-spacing: -0.02em;
}

.card-footer {
  font-size: 0.78rem;
  color: #9ab0b8;
  border-top: 1px solid #f0f4f8;
  padding-top: 10px;
  margin-top: 4px;
}

/* ── Status messages ─────────────────────────── */
.status-msg {
  color: #6b8796;
  margin: 40px 0;
}

.status-msg.error {
  color: #b42318;
}
</style>
