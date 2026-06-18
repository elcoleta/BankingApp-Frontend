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
        <RouterLink class="nav-item active" to="/transfer"><span class="nav-icon">➜</span> Transfer</RouterLink>
        <RouterLink class="nav-item" to="/atm"><span class="nav-icon">🏧</span> ATM</RouterLink>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <main class="main">
      <header class="topbar">
        <h1>Transfer Funds</h1>
      </header>

      <div class="content-grid">

        <!-- Transfer form -->
        <div class="card form-card">
          <h2 class="card-title">Send Money</h2>

          <div v-if="success" class="alert success">
            Transfer of €{{ lastAmount }} completed successfully.
          </div>
          <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>

          <form @submit.prevent="submitTransfer">
            <div class="field">
              <label>From account</label>
              <select v-model="fromIban" required>
                <option value="" disabled>Select account</option>
                <option v-for="acc in accounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.accountType }} — {{ acc.iban }} (€{{ acc.balance.toFixed(2) }})
                </option>
              </select>
              <p v-if="selectedAccount" class="hint">
                Daily limit: €{{ selectedAccount.dailyTransferLimit.toFixed(0) }} &bull;
                Used today: €{{ todayUsed.toFixed(2) }} &bull;
                Remaining: €{{ Math.max(0, selectedAccount.dailyTransferLimit - todayUsed).toFixed(2) }}
              </p>
            </div>

            <div class="field">
              <label>To IBAN</label>
              <input v-model="toIban" type="text" placeholder="NL00INHO0000000000" required />
            </div>

            <div class="field">
              <label>Amount (€)</label>
              <input v-model.number="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
            </div>

            <div class="field">
              <label>Description</label>
              <input v-model="description" type="text" placeholder="Optional description" />
            </div>

            <button type="submit" class="submit-btn" :disabled="submitting">
              {{ submitting ? 'Sending…' : 'Send Transfer' }}
            </button>
          </form>
        </div>

        <!-- Customer search panel -->
        <div class="card search-card">
          <h2 class="card-title">Find Recipient</h2>
          <p class="search-hint">Search by name or IBAN to fill the destination field.</p>

          <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Name or IBAN…" @keyup.enter="doSearch" />
            <button @click="doSearch" :disabled="searching">
              {{ searching ? '…' : 'Search' }}
            </button>
          </div>

          <p v-if="searchError" class="search-error">{{ searchError }}</p>

          <div v-if="searchResults.length > 0" class="results">
            <div v-for="customer in searchResults" :key="customer.id" class="result-item">
              <div class="result-info">
                <span class="result-name">{{ customer.firstName }} {{ customer.lastName }}</span>
                <span class="result-email">{{ customer.email }}</span>
              </div>
              <div class="result-ibans">
                <button
                  v-for="iban in customer.ibans"
                  :key="iban"
                  class="iban-btn"
                  @click="toIban = iban"
                >
                  {{ iban }}
                </button>
              </div>
            </div>
          </div>

          <p v-else-if="searched && searchResults.length === 0" class="no-results">
            No customers found.
          </p>
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
const fromIban = ref('')
const toIban = ref('')
const amount = ref('')
const description = ref('')
const submitting = ref(false)
const success = ref(false)
const lastAmount = ref(0)
const errorMsg = ref('')
const todayUsed = ref(0)

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searched = ref(false)
const searchError = ref('')

const selectedAccount = computed(() =>
  accounts.value.find(a => a.iban === fromIban.value) || null
)

onMounted(async () => {
  try {
    const res = await api.get('/accounts/my')
    accounts.value = res.data
    if (res.data.length > 0) fromIban.value = res.data[0].iban
  } catch (err) {
    if (err.response?.status === 401) { userStore.logout(); router.push('/login') }
  }
})

async function submitTransfer() {
  success.value = false
  errorMsg.value = ''
  submitting.value = true
  try {
    await api.post('/transactions/transfer', {
      fromIban: fromIban.value,
      toIban: toIban.value.trim().toUpperCase(),
      amount: amount.value,
      description: description.value || undefined,
    })
    lastAmount.value = amount.value
    success.value = true
    toIban.value = ''
    amount.value = ''
    description.value = ''
    // Refresh balances
    const res = await api.get('/accounts/my')
    accounts.value = res.data
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Transfer failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function doSearch() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  searched.value = false
  searchError.value = ''
  searchResults.value = []
  try {
    const query = searchQuery.value.trim()
    const isIban = /^NL/i.test(query)
    const params = isIban ? { iban: query } : { name: query }
    const res = await api.get('/customers/search', { params })
    searchResults.value = res.data
    searched.value = true
  } catch {
    searchError.value = 'Search failed.'
  } finally {
    searching.value = false
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
  width: 36px; height: 36px; border-radius: 8px; background: #126660;
  color: white; font-weight: 800; font-size: 1.1rem; display: grid; place-items: center;
}

.logo-name { color: white; font-weight: 700; font-size: 1.05rem; }

nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 8px; color: #8faab5; font-size: 0.92rem; font-weight: 500; text-decoration: none;
}

.nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
.nav-item.active, .router-link-active { background: #126660; color: white; }

.nav-icon { font-size: 1rem; width: 18px; text-align: center; }

.logout-btn {
  margin-top: auto; background: rgba(255,255,255,0.07); border: none;
  color: #8faab5; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 500;
}
.logout-btn:hover { background: rgba(255,255,255,0.13); color: white; }

.main { flex: 1; padding: 36px 40px; overflow-y: auto; }

.topbar { margin-bottom: 28px; }
h1 { margin: 0; font-size: 1.9rem; color: #0d2b36; }

.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

.card {
  background: white; border-radius: 14px; padding: 28px;
  box-shadow: 0 2px 12px rgba(13,43,54,0.07); border: 1px solid #dce5e8;
}

.card-title { margin: 0 0 20px; font-size: 1.05rem; color: #0d2b36; font-weight: 700; }

.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }

label { font-size: 0.82rem; font-weight: 600; color: #6b8796; text-transform: uppercase; letter-spacing: 0.05em; }

input, select {
  padding: 11px 14px; border: 1px solid #dce5e8; border-radius: 8px;
  font-size: 0.92rem; color: #0d2b36; background: white; outline: none;
}
input:focus, select:focus { border-color: #126660; }

.hint { margin: 0; font-size: 0.78rem; color: #6b8796; }

.submit-btn {
  width: 100%; padding: 13px; background: #126660; color: white; border: none;
  border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 8px;
}
.submit-btn:hover:not(:disabled) { background: #0e514d; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; font-weight: 500; }
.alert.success { background: #e8fdf4; color: #0d6640; border: 1px solid #b6f0d8; }
.alert.error { background: #fdecea; color: #b42318; border: 1px solid #f5c5c0; }

.search-hint { font-size: 0.85rem; color: #6b8796; margin: 0 0 16px; }

.search-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.search-bar input { flex: 1; }
.search-bar button {
  padding: 11px 18px; background: #0d2b36; color: white; border: none;
  border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;
}
.search-bar button:hover:not(:disabled) { background: #126660; }
.search-bar button:disabled { opacity: 0.5; }

.search-error, .no-results { font-size: 0.88rem; color: #b42318; }
.no-results { color: #6b8796; }

.results { display: flex; flex-direction: column; gap: 12px; }

.result-item {
  padding: 14px; border: 1px solid #dce5e8; border-radius: 10px; background: #f8fafc;
}

.result-info { display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px; }
.result-name { font-weight: 700; color: #0d2b36; }
.result-email { font-size: 0.82rem; color: #6b8796; }

.result-ibans { display: flex; flex-wrap: wrap; gap: 8px; }

.iban-btn {
  padding: 5px 12px; border: 1px solid #126660; border-radius: 20px; background: white;
  color: #126660; font-size: 0.78rem; font-family: monospace; cursor: pointer; font-weight: 600;
}
.iban-btn:hover { background: #126660; color: white; }
</style>
