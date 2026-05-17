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
        <RouterLink class="nav-item active" to="/transfer">
          <span class="nav-icon">➜</span> Transfer
        </RouterLink>
        <RouterLink class="nav-item" to="/atm">
          <span class="nav-icon">🏧</span> ATM
        </RouterLink>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <!-- Main content -->
    <main class="main">
      <header class="topbar">
        <h1>Transfer Between Accounts</h1>
        <p class="subtitle">Move money between your own accounts instantly.</p>
      </header>

      <p v-if="loadingAccounts" class="status-msg">Loading accounts…</p>
      <p v-else-if="loadError" class="status-msg error">{{ loadError }}</p>

      <template v-else>
        <div class="form-card">

          <!-- From account -->
          <div class="field">
            <label for="fromAccount">From Account</label>
            <select id="fromAccount" v-model="fromIban">
              <option value="" disabled>Select source account</option>
              <option v-for="acc in accounts" :key="acc.iban" :value="acc.iban">
                {{ acc.iban }} — {{ acc.accountType }} — € {{ acc.balance.toFixed(2) }}
              </option>
            </select>
          </div>

          <!-- To account -->
          <div class="field">
            <label for="toAccount">To Account</label>
            <select id="toAccount" v-model="toIban">
              <option value="" disabled>Select destination account</option>
              <option
                v-for="acc in accounts"
                :key="acc.iban"
                :value="acc.iban"
                :disabled="acc.iban === fromIban"
              >
                {{ acc.iban }} — {{ acc.accountType }} — € {{ acc.balance.toFixed(2) }}
              </option>
            </select>
          </div>

          <!-- Amount -->
          <div class="field">
            <label for="amount">Amount (€)</label>
            <input
              id="amount"
              v-model.number="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <!-- Description -->
          <div class="field">
            <label for="description">Description <span class="optional">(optional)</span></label>
            <input
              id="description"
              v-model="description"
              type="text"
              placeholder="e.g. Transfer to savings"
              maxlength="120"
            />
          </div>

          <!-- Feedback -->
          <p v-if="successMsg" class="feedback success">✓ {{ successMsg }}</p>
          <p v-if="submitError" class="feedback error">✕ {{ submitError }}</p>

          <button
            class="submit-btn"
            :disabled="isSubmitting || !fromIban || !toIban || !amount || fromIban === toIban"
            @click="handleTransfer"
          >
            {{ isSubmitting ? 'Processing…' : 'Transfer Now' }}
          </button>

          <p v-if="fromIban === toIban && fromIban" class="feedback error">
            Source and destination accounts must be different.
          </p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const accounts = ref([])
const loadingAccounts = ref(true)
const loadError = ref('')

const fromIban = ref('')
const toIban = ref('')
const amount = ref('')
const description = ref('')

const isSubmitting = ref(false)
const successMsg = ref('')
const submitError = ref('')

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

async function handleTransfer() {
  successMsg.value = ''
  submitError.value = ''
  isSubmitting.value = true

  try {
    await api.post('/transactions/transfer/own', {
      fromIban: fromIban.value,
      toIban: toIban.value,
      amount: amount.value,
      description: description.value || undefined,
    })

    successMsg.value = `€ ${Number(amount.value).toFixed(2)} transferred successfully!`
    amount.value = ''
    description.value = ''

    // Refresh balances
    const res = await api.get('/accounts/my')
    accounts.value = res.data
  } catch (err) {
    submitError.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Transfer failed. Please try again.'
  } finally {
    isSubmitting.value = false
  }
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

.topbar {
  margin-bottom: 32px;
}

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

/* ── Form card ───────────────────────────────── */
.form-card {
  background: white;
  border-radius: 16px;
  padding: 36px;
  max-width: 560px;
  box-shadow: 0 2px 16px rgba(13, 43, 54, 0.08);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0d2b36;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #9ab0b8;
}

.field select,
.field input[type="number"],
.field input[type="text"] {
  padding: 12px 14px;
  border: 1.5px solid #dce5e8;
  border-radius: 10px;
  font-size: 0.97rem;
  color: #0d2b36;
  background: #f8fafc;
  transition: border-color 0.15s, background 0.15s;
  appearance: auto;
}

.field select:focus,
.field input:focus {
  outline: none;
  border-color: #126660;
  background: white;
}

.submit-btn {
  padding: 14px;
  background: #126660;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.submit-btn:hover:not(:disabled) {
  background: #0d4a44;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.feedback {
  margin: 0;
  font-size: 0.9rem;
  padding: 12px 16px;
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
