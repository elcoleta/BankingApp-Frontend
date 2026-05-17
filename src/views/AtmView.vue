<template>
  <div class="layout">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-name">BankApp</span>
      </div>
      <nav>
        <RouterLink class="nav-item" to="/dashboard">
          <span class="nav-icon">⊞</span> Dashboard
        </RouterLink>
        <RouterLink class="nav-item" to="/transactions">
          <span class="nav-icon">↕</span> Transactions
        </RouterLink>
        <RouterLink class="nav-item" to="/transfer">
          <span class="nav-icon">➜</span> Transfer
        </RouterLink>
        <RouterLink class="nav-item active" to="/atm">
          <span class="nav-icon"></span> ATM
        </RouterLink>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <!-- Main content -->
    <main class="main">
      <header class="topbar">
        <h1>ATM</h1>
        <p class="subtitle">Withdraw cash from or deposit cash into your account.</p>
      </header>

      <p v-if="loadingAccounts" class="status-msg">Loading accounts…</p>
      <p v-else-if="loadError" class="status-msg error">{{ loadError }}</p>

      <template v-else>

        <!-- Account selector -->
        <div class="account-selector">
          <label for="accountSelect">Select Account</label>
          <select id="accountSelect" v-model="selectedIban" @change="clearMessages">
            <option value="" disabled>Choose an account</option>
            <option v-for="acc in accounts" :key="acc.iban" :value="acc.iban">
              {{ acc.iban }} — {{ acc.accountType }}
            </option>
          </select>
        </div>

        <!-- Selected account balance display -->
        <div v-if="selectedAccount" class="balance-card">
          <p class="balance-label">Current Balance</p>
          <p class="balance-amount">€ {{ selectedAccount.balance.toFixed(2) }}</p>
          <p class="balance-iban">{{ selectedAccount.iban }}</p>
        </div>

        <!-- ATM panels -->
        <div v-if="selectedIban" class="atm-panels">

          <!-- Withdraw panel -->
          <div class="atm-panel">
            <div class="panel-header withdraw">
              <span class="panel-icon">↑</span>
              <h2>Withdraw</h2>
            </div>
            <div class="panel-body">
              <div class="field">
                <label for="withdrawAmount">Amount (€)</label>
                <input
                  id="withdrawAmount"
                  v-model.number="withdrawAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <p v-if="withdrawSuccess" class="feedback success">✓ {{ withdrawSuccess }}</p>
              <p v-if="withdrawError" class="feedback error">✕ {{ withdrawError }}</p>

              <button
                class="action-btn withdraw-btn"
                :disabled="isWithdrawing || !withdrawAmount || withdrawAmount <= 0"
                @click="handleWithdraw"
              >
                {{ isWithdrawing ? 'Processing…' : 'Withdraw' }}
              </button>
            </div>
          </div>

          <!-- Deposit panel -->
          <div class="atm-panel">
            <div class="panel-header deposit">
              <span class="panel-icon">↓</span>
              <h2>Deposit</h2>
            </div>
            <div class="panel-body">
              <div class="field">
                <label for="depositAmount">Amount (€)</label>
                <input
                  id="depositAmount"
                  v-model.number="depositAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <p v-if="depositSuccess" class="feedback success">✓ {{ depositSuccess }}</p>
              <p v-if="depositError" class="feedback error">✕ {{ depositError }}</p>

              <button
                class="action-btn deposit-btn"
                :disabled="isDepositing || !depositAmount || depositAmount <= 0"
                @click="handleDeposit"
              >
                {{ isDepositing ? 'Processing…' : 'Deposit' }}
              </button>
            </div>
          </div>

        </div>

        <p v-else class="status-msg">Please select an account to get started.</p>

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

const accounts = ref([])
const loadingAccounts = ref(true)
const loadError = ref('')

const selectedIban = ref('')

const withdrawAmount = ref('')
const depositAmount = ref('')

const isWithdrawing = ref(false)
const isDepositing = ref(false)

const withdrawSuccess = ref('')
const withdrawError = ref('')
const depositSuccess = ref('')
const depositError = ref('')

// Reactive reference to the currently selected account object
const selectedAccount = computed(() =>
  accounts.value.find(a => a.iban === selectedIban.value) || null
)

onMounted(async () => {
  try {
    const res = await api.get('/accounts/my')
    accounts.value = res.data
  } catch (err) {
    if (err.response?.status === 401) {
      userStore.logout()
      router.push('/login')
    } else {
      loadError.value = 'Could not load accounts. Is the backend running?'
    }
  } finally {
    loadingAccounts.value = false
  }
})

async function refreshAccounts() {
  const res = await api.get('/accounts/my')
  accounts.value = res.data
}

async function handleWithdraw() {
  withdrawSuccess.value = ''
  withdrawError.value = ''
  isWithdrawing.value = true

  try {
    const res = await api.post('/atm/withdraw', {
      iban: selectedIban.value,
      amount: withdrawAmount.value,
    })
    withdrawSuccess.value = `Withdrew € ${Number(withdrawAmount.value).toFixed(2)} successfully.`
    withdrawAmount.value = ''
    // Update account list with fresh balances from server response or re-fetch
    await refreshAccounts()
  } catch (err) {
    withdrawError.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Withdrawal failed. Please try again.'
  } finally {
    isWithdrawing.value = false
  }
}

async function handleDeposit() {
  depositSuccess.value = ''
  depositError.value = ''
  isDepositing.value = true

  try {
    await api.post('/atm/deposit', {
      iban: selectedIban.value,
      amount: depositAmount.value,
    })
    depositSuccess.value = `Deposited € ${Number(depositAmount.value).toFixed(2)} successfully.`
    depositAmount.value = ''
    await refreshAccounts()
  } catch (err) {
    depositError.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Deposit failed. Please try again.'
  } finally {
    isDepositing.value = false
  }
}

function clearMessages() {
  withdrawSuccess.value = ''
  withdrawError.value = ''
  depositSuccess.value = ''
  depositError.value = ''
}

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

.nav-item:hover { background: rgba(255,255,255,0.06); color: white; }

.nav-item.active,
.nav-item.router-link-active {
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

.logout-btn:hover { background: rgba(255,255,255,0.13); color: white; }

/* ── Main ────────────────────────────────────── */
.main {
  flex: 1;
  padding: 36px 40px;
  overflow-y: auto;
}

.topbar { margin-bottom: 32px; }

h1 {
  margin: 0 0 6px;
  font-size: 1.9rem;
  color: #0d2b36;
}

.subtitle {
  margin: 0;
  color: #6b8796;
  font-size: 0.92rem;
}

/* ── Account selector ────────────────────────── */
.account-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
  margin-bottom: 28px;
}

.account-selector label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0d2b36;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.account-selector select {
  padding: 12px 14px;
  border: 1.5px solid #dce5e8;
  border-radius: 10px;
  font-size: 0.97rem;
  color: #0d2b36;
  background: white;
  appearance: auto;
  transition: border-color 0.15s;
}

.account-selector select:focus {
  outline: none;
  border-color: #126660;
}

/* ── Balance display ─────────────────────────── */
.balance-card {
  background: linear-gradient(135deg, #126660, #0d4a44);
  border-radius: 14px;
  padding: 24px 32px;
  color: white;
  max-width: 560px;
  margin-bottom: 32px;
}

.balance-label {
  margin: 0 0 6px;
  font-size: 0.78rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.balance-amount {
  margin: 0 0 4px;
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.balance-iban {
  margin: 0;
  font-size: 0.82rem;
  opacity: 0.65;
  font-family: monospace;
  letter-spacing: 0.04em;
}

/* ── ATM panels ──────────────────────────────── */
.atm-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 760px;
}

@media (max-width: 700px) {
  .atm-panels { grid-template-columns: 1fr; }
}

.atm-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(13, 43, 54, 0.08);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  color: white;
}

.panel-header.withdraw {
  background: linear-gradient(135deg, #0d2b36, #1a4a5e);
}

.panel-header.deposit {
  background: linear-gradient(135deg, #126660, #0d7a6e);
}

.panel-icon {
  font-size: 1.4rem;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.panel-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0d2b36;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input {
  padding: 12px 14px;
  border: 1.5px solid #dce5e8;
  border-radius: 10px;
  font-size: 1rem;
  color: #0d2b36;
  background: #f8fafc;
  transition: border-color 0.15s, background 0.15s;
}

.field input:focus {
  outline: none;
  border-color: #126660;
  background: white;
}

.action-btn {
  padding: 13px;
  border: none;
  border-radius: 10px;
  font-size: 0.97rem;
  font-weight: 700;
  cursor: pointer;
  color: white;
  transition: opacity 0.15s, transform 0.1s;
}

.action-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.withdraw-btn { background: #0d2b36; }
.deposit-btn  { background: #126660; }

.feedback {
  margin: 0;
  font-size: 0.86rem;
  padding: 10px 14px;
  border-radius: 8px;
}

.feedback.success {
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.feedback.error {
  background: #fef2f2;
  color: #b42318;
  border: 1px solid #fecaca;
}

.status-msg { color: #6b8796; margin: 40px 0; }
.status-msg.error { color: #b42318; }
</style>
