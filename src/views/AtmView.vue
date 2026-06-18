<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-name">BankApp</span>
      </div>
      <nav>
        <RouterLink class="nav-item" to="/dashboard"><span class="nav-icon">⊞</span> Dashboard</RouterLink>
        <RouterLink class="nav-item" to="/transactions"><span class="nav-icon">↕</span> Transactions</RouterLink>
        <RouterLink class="nav-item" to="/transfer"><span class="nav-icon">➜</span> Transfer</RouterLink>
        <RouterLink class="nav-item active" to="/atm"><span class="nav-icon">🏧</span> ATM</RouterLink>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <main class="main">
      <header class="topbar">
        <h1>ATM</h1>
      </header>

      <div class="atm-wrapper">
        <div class="atm-machine">
          <div class="atm-screen">
            <p class="screen-label">ACCOUNT</p>
            <select v-model="selectedIban" class="screen-select">
              <option value="" disabled>Insert card / select account</option>
              <option v-for="acc in accounts" :key="acc.iban" :value="acc.iban">
                {{ acc.accountType }}: {{ acc.iban }}
              </option>
            </select>

            <template v-if="selectedAccount">
              <p class="screen-balance">€ {{ selectedAccount.balance.toFixed(2) }}</p>
              <p class="screen-type">{{ selectedAccount.accountType }} ACCOUNT</p>
            </template>

            <div v-if="receipt" class="receipt" :class="receipt.type">
              <p>{{ receipt.message }}</p>
              <p v-if="receipt.newBalance !== undefined">New balance: €{{ receipt.newBalance.toFixed(2) }}</p>
            </div>
          </div>

          <div class="atm-tabs">
            <button :class="{ active: mode === 'deposit' }" @click="mode = 'deposit'; receipt = null">
              Deposit
            </button>
            <button :class="{ active: mode === 'withdraw' }" @click="mode = 'withdraw'; receipt = null">
              Withdraw
            </button>
          </div>

          <div class="atm-input">
            <label>Amount (€)</label>
            <input v-model.number="amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
          </div>

          <div class="quick-amounts">
            <button v-for="q in [20, 50, 100, 200]" :key="q" @click="amount = q">€{{ q }}</button>
          </div>

          <button class="confirm-btn" :disabled="!selectedIban || !amount || submitting" @click="confirm">
            {{ submitting ? 'Processing…' : (mode === 'deposit' ? 'Deposit' : 'Withdraw') }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const accounts = ref([])
const selectedIban = ref('')
const amount = ref('')
const mode = ref('deposit')
const submitting = ref(false)
const receipt = ref(null)

const selectedAccount = computed(() =>
  accounts.value.find(a => a.iban === selectedIban.value) || null
)

onMounted(async () => {
  try {
    const res = await api.get('/accounts/my')
    accounts.value = res.data
    if (res.data.length > 0) selectedIban.value = res.data[0].iban
  } catch (err) {
    if (err.response?.status === 401) { userStore.logout(); router.push('/login') }
  }
})

async function confirm() {
  if (!selectedIban.value || !amount.value) return
  submitting.value = true
  receipt.value = null
  try {
    const endpoint = mode.value === 'deposit' ? '/atm/deposit' : '/atm/withdraw'
    const res = await api.post(endpoint, { iban: selectedIban.value, amount: amount.value })
    // Refresh accounts to get updated balance
    const refreshed = await api.get('/accounts/my')
    accounts.value = refreshed.data
    const newBalance = refreshed.data.find(a => a.iban === selectedIban.value)?.balance
    receipt.value = {
      type: 'success',
      message: `${mode.value === 'deposit' ? 'Deposit' : 'Withdrawal'} of €${Number(amount.value).toFixed(2)} successful.`,
      newBalance,
    }
    amount.value = ''
  } catch (err) {
    receipt.value = {
      type: 'error',
      message: err.response?.data?.message || 'Transaction failed.',
    }
  } finally {
    submitting.value = false
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; background: #f0f4f8; font-family: system-ui, sans-serif; }

.sidebar {
  width: 220px; background: #0d2b36; display: flex; flex-direction: column;
  padding: 28px 16px; gap: 8px; flex-shrink: 0;
}
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
.logo-mark {
  width: 36px; height: 36px; border-radius: 8px; background: #126660; color: white;
  font-weight: 800; font-size: 1.1rem; display: grid; place-items: center;
}
.logo-name { color: white; font-weight: 700; font-size: 1.05rem; }
nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 8px; color: #8faab5; font-size: 0.92rem; font-weight: 500; text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
.nav-item.active, .router-link-active { background: #126660; color: white; }
.nav-icon { width: 18px; text-align: center; }
.logout-btn {
  margin-top: auto; background: rgba(255,255,255,0.07); border: none;
  color: #8faab5; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 500;
}
.logout-btn:hover { background: rgba(255,255,255,0.13); color: white; }

.main { flex: 1; padding: 36px 40px; }
.topbar { margin-bottom: 32px; }
h1 { margin: 0; font-size: 1.9rem; color: #0d2b36; }

.atm-wrapper { display: flex; justify-content: center; }

.atm-machine {
  background: #1a2e38;
  border-radius: 20px;
  padding: 32px;
  width: 380px;
  box-shadow: 0 8px 40px rgba(13,43,54,0.3);
}

.atm-screen {
  background: #0a1a22;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #1e3d4f;
}

.screen-label {
  margin: 0;
  font-size: 0.7rem;
  color: #3a6878;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}

.screen-select {
  background: transparent;
  color: #7fcfa8;
  border: none;
  outline: none;
  font-size: 0.82rem;
  font-family: monospace;
  cursor: pointer;
  padding: 4px 0;
}
.screen-select option { background: #0a1a22; color: #7fcfa8; }

.screen-balance {
  margin: 8px 0 0;
  font-size: 2.2rem;
  font-weight: 800;
  color: #7fcfa8;
  letter-spacing: -0.02em;
  font-family: monospace;
}

.screen-type {
  margin: 0;
  font-size: 0.72rem;
  color: #3a6878;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.receipt {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}
.receipt p { margin: 0 0 4px; }
.receipt p:last-child { margin: 0; }
.receipt.success { background: rgba(127,207,168,0.15); color: #7fcfa8; border: 1px solid rgba(127,207,168,0.3); }
.receipt.error { background: rgba(220,80,80,0.15); color: #f08080; border: 1px solid rgba(220,80,80,0.3); }

.atm-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.atm-tabs button {
  flex: 1; padding: 10px; border: 1px solid #2d4a58; border-radius: 8px;
  background: transparent; color: #6b8796; cursor: pointer; font-size: 0.9rem; font-weight: 600;
  transition: all 0.15s;
}
.atm-tabs button.active { background: #126660; color: white; border-color: #126660; }
.atm-tabs button:not(.active):hover { background: rgba(255,255,255,0.06); color: white; }

.atm-input { margin-bottom: 12px; }
.atm-input label { display: block; font-size: 0.75rem; color: #6b8796; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.atm-input input {
  width: 100%; padding: 12px 14px; background: #0a1a22; border: 1px solid #1e3d4f;
  border-radius: 8px; color: #7fcfa8; font-size: 1rem; font-family: monospace; outline: none; box-sizing: border-box;
}
.atm-input input:focus { border-color: #126660; }
.atm-input input::placeholder { color: #3a6878; }

.quick-amounts { display: flex; gap: 8px; margin-bottom: 20px; }
.quick-amounts button {
  flex: 1; padding: 8px; background: #0a1a22; border: 1px solid #1e3d4f;
  border-radius: 6px; color: #6b8796; cursor: pointer; font-size: 0.82rem; font-weight: 600;
}
.quick-amounts button:hover { background: #126660; color: white; border-color: #126660; }

.confirm-btn {
  width: 100%; padding: 14px; background: #126660; color: white; border: none;
  border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em;
}
.confirm-btn:hover:not(:disabled) { background: #0e514d; }
.confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
