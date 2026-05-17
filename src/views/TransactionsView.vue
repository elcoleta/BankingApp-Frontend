<template>
  <div class="layout">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-name">BankApp</span>
      </div>
      <nav>
        <a class="nav-item" href="#/dashboard">⊞ Dashboard</a>
        <a class="nav-item active" href="#/transactions">↕ Transactions</a>
        <a class="nav-item" href="#">➜ Transfer</a>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <!-- Main content -->
    <main class="main">
      <header class="topbar">
        <h1>Transaction History</h1>
      </header>

      <!-- Filters -->
      <div class="filters">
        <input
          v-model="searchIban"
          type="text"
          placeholder="Search by IBAN..."
        />
        <input
          v-model="minAmount"
          type="number"
          placeholder="Min amount"
        />
        <input
          v-model="maxAmount"
          type="number"
          placeholder="Max amount"
        />
        <button @click="resetFilters">Reset</button>
      </div>

      <p v-if="loading" class="status-msg">Loading transactions…</p>
      <p v-else-if="error" class="status-msg error">{{ error }}</p>

      <div v-else class="table-wrapper">
        <p v-if="filteredTransactions.length === 0" class="status-msg">
          No transactions match your search.
        </p>
        <table v-else>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in filteredTransactions" :key="transaction.id">
              <td>{{ formatDate(transaction.timestamp) }}</td>
              <td>{{ transaction.description }}</td>
              <td class="iban">{{ transaction.fromIban }}</td>
              <td class="iban">{{ transaction.toIban }}</td>
              <td :class="isIncoming(transaction) ? 'amount-in' : 'amount-out'">
                {{ isIncoming(transaction) ? '+' : '-' }} € {{ transaction.amount.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

const transactions = ref([])
const myIbans = ref([])
const loading = ref(true)
const error = ref('')

// Filter values
const searchIban = ref('')
const minAmount = ref('')
const maxAmount = ref('')

// Filtered list — recalculates automatically when filters or transactions change
const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    const matchesIban = searchIban.value === '' ||
      t.fromIban.includes(searchIban.value.toUpperCase()) ||
      t.toIban.includes(searchIban.value.toUpperCase())

    const matchesMin = minAmount.value === '' || t.amount >= Number(minAmount.value)
    const matchesMax = maxAmount.value === '' || t.amount <= Number(maxAmount.value)

    return matchesIban && matchesMin && matchesMax
  })
})

onMounted(async () => {
  try {
    const accountsResponse = await api.get('/accounts/my')
    myIbans.value = accountsResponse.data.map(a => a.iban)

    const transactionsResponse = await api.get('/transactions/my')
    transactions.value = transactionsResponse.data
  } catch (err) {
    if (err.response?.status === 401) {
      userStore.logout()
      router.push('/login')
    } else {
      error.value = 'Could not load transactions.'
    }
  } finally {
    loading.value = false
  }
})

function isIncoming(transaction) {
  return myIbans.value.includes(transaction.toIban)
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function resetFilters() {
  searchIban.value = ''
  minAmount.value = ''
  maxAmount.value = ''
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f0f4f8;
  font-family: system-ui, sans-serif;
}

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
}

.nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
.nav-item.active { background: #126660; color: white; }

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
}

.logout-btn:hover { background: rgba(255,255,255,0.13); color: white; }

.main {
  flex: 1;
  padding: 36px 40px;
  overflow-y: auto;
}

.topbar { margin-bottom: 28px; }

h1 {
  margin: 0;
  font-size: 1.9rem;
  color: #0d2b36;
}

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters input {
  padding: 10px 14px;
  border: 1px solid #dce5e8;
  border-radius: 8px;
  font-size: 0.92rem;
  color: #0d2b36;
  background: white;
  flex: 1;
  min-width: 160px;
}

.filters input:focus {
  outline: none;
  border-color: #126660;
}

.filters button {
  padding: 10px 20px;
  background: #0d2b36;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
}

.filters button:hover { background: #126660; }

/* Table */
.table-wrapper {
  background: white;
  border-radius: 14px;
  border: 1px solid #dce5e8;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

thead {
  background: #f8fafc;
  border-bottom: 1px solid #dce5e8;
}

th {
  padding: 14px 20px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b8796;
}

td {
  padding: 16px 20px;
  color: #0d2b36;
  border-bottom: 1px solid #f0f4f8;
}

tr:last-child td { border-bottom: none; }
tr:hover td { background: #f8fafc; }

.iban {
  font-size: 0.82rem;
  color: #6b8796;
  font-family: monospace;
}

.amount-in  { color: #16a34a; font-weight: 700; }
.amount-out { color: #b42318; font-weight: 700; }

.status-msg { color: #6b8796; margin: 40px 0; }
.status-msg.error { color: #b42318; }
</style>