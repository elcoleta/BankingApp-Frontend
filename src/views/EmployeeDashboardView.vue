<template>
  <div class="layout">

    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-name">BankApp</span>
      </div>
      <nav>
        <a class="nav-item active" href="#/employee/dashboard">
          <span class="nav-icon">⊞</span> All Accounts
        </a>
        <a class="nav-item" href="#/employee/customers">
          <span class="nav-icon">⏳</span> Pending Customers
          <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
        </a>
      </nav>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <p class="greeting">Employee portal</p>
          <h1>All Accounts</h1>
        </div>
        <div class="topbar-meta">
          <span v-if="totalElements !== null" class="total-badge">{{ totalElements }} accounts total</span>
        </div>
      </header>

      <p v-if="loading" class="status-msg">Loading accounts…</p>
      <p v-else-if="error" class="status-msg error">{{ error }}</p>

      <template v-else>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>IBAN</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Abs. limit</th>
                <th>Daily limit</th>
                <th>Approval</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in accounts" :key="account.accountId">
                <td class="name-cell">{{ account.customerName }}</td>
                <td class="email-cell">{{ account.customerEmail }}</td>
                <td class="iban-cell">{{ account.iban }}</td>
                <td>
                  <span class="badge" :class="account.accountType.toLowerCase()">
                    {{ account.accountType }}
                  </span>
                </td>
                <td class="amount">€ {{ fmt(account.balance) }}</td>
                <td class="amount">€ {{ fmt(account.absoluteTransferLimit) }}</td>
                <td class="amount">€ {{ fmt(account.dailyTransferLimit) }}</td>
                <td>
                  <span class="badge" :class="account.customerStatus.toLowerCase()">
                    {{ account.customerStatus }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="account.active ? 'active' : 'inactive'">
                    {{ account.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">&#8592; Prev</button>
          <span class="page-info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
          <button :disabled="currentPage >= totalPages - 1" @click="goToPage(currentPage + 1)">Next &#8594;</button>
        </div>

        <!-- Pending customers without accounts -->
        <template v-if="pendingCustomers.length > 0">
          <div class="section-header">
            <h2>Awaiting approval — no accounts yet</h2>
            <span class="total-badge">{{ pendingCount }} customer{{ pendingCount !== 1 ? 's' : '' }}</span>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>BSN</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in pendingCustomers" :key="c.id">
                  <td class="name-cell">{{ c.firstName }} {{ c.lastName }}</td>
                  <td class="email-cell">{{ c.email }}</td>
                  <td class="iban-cell">{{ c.bsn }}</td>
                  <td>{{ c.phoneNumber }}</td>
                  <td><span class="badge pending">PENDING</span></td>
                  <td>
                    <button
                      class="approve-btn"
                      :disabled="approvingId === c.id"
                      @click="approve(c.id)"
                    >
                      {{ approvingId === c.id ? 'Approving…' : 'Approve' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

const router = useRouter()
const userStore = useUserStore()

const accounts = ref([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(0)
const totalPages = ref(1)
const totalElements = ref(null)
const pageSize = 10

const pendingCustomers = ref([])
const pendingCount = ref(0)
const approvingId = ref(null)

async function loadPage(page) {
  loading.value = true
  error.value = ''
  try {
    const [accountsRes, pendingRes] = await Promise.all([
      api.get('/employees/accounts', { params: { page, size: pageSize } }),
      api.get('/employees/customers/pending', { params: { page: 0, size: 100 } }),
    ])
    accounts.value = accountsRes.data.content
    currentPage.value = accountsRes.data.number
    totalPages.value = accountsRes.data.totalPages
    totalElements.value = accountsRes.data.totalElements
    pendingCustomers.value = pendingRes.data.content
    pendingCount.value = pendingRes.data.totalElements
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      userStore.logout()
      router.push('/login')
    } else {
      error.value = 'Could not load data. Is the backend running?'
    }
  } finally {
    loading.value = false
  }
}

function goToPage(page) { loadPage(page) }

async function approve(id) {
  approvingId.value = id
  try {
    await api.post(`/employees/customers/${id}/approve`)
    await loadPage(currentPage.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Approval failed'
  } finally {
    approvingId.value = null
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function fmt(value) {
  return Number(value).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => loadPage(0))
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f3f6f8;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #14323f;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 7px;
  background: #126660;
  font-weight: 800;
  font-size: 1.1rem;
}

.logo-name { font-weight: 700; font-size: 1.05rem; }

nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 7px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.95rem;
}

.nav-item.active {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item:hover:not(.active) { background: rgba(255,255,255,0.06); color: white; }

.nav-badge {
  margin-left: auto;
  background: #e8a020;
  color: white;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.73rem;
  font-weight: 700;
}

.logout-btn {
  margin: 0 12px 8px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 7px;
  padding: 9px;
  background: transparent;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-btn:hover { background: rgba(255,255,255,0.08); color: white; }

.main { flex: 1; padding: 32px; overflow-x: auto; }

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.greeting {
  margin: 0;
  color: #5b7a85;
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 { margin: 4px 0 0; color: #14323f; font-size: 1.6rem; }

.topbar-meta { display: flex; align-items: center; padding-top: 8px; }

.total-badge {
  background: #e8f0f3;
  color: #14323f;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.85rem;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 36px 0 16px;
}

.section-header h2 {
  margin: 0;
  color: #14323f;
  font-size: 1.1rem;
}

.table-wrapper {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(20, 50, 63, 0.07);
  overflow-x: auto;
}

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }

thead { background: #f8fafc; border-bottom: 2px solid #e8edf0; }

th {
  padding: 13px 16px;
  text-align: left;
  color: #5b7a85;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  white-space: nowrap;
}

td {
  padding: 13px 16px;
  border-bottom: 1px solid #f0f4f6;
  color: #243942;
  vertical-align: middle;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #f8fbfc; }

.name-cell { font-weight: 600; white-space: nowrap; }
.email-cell { color: #5b7a85; font-size: 0.85rem; }
.iban-cell { font-family: monospace; font-size: 0.85rem; letter-spacing: 0.03em; }
.amount { text-align: right; font-variant-numeric: tabular-nums; }

.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.approve-btn {
  border: 0;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  background: #126660;
  color: white;
  white-space: nowrap;
}
.approve-btn:hover:not(:disabled) { background: #0e514d; }
.approve-btn:disabled { opacity: 0.6; cursor: wait; }

.badge.checking  { background: #e8f4fe; color: #1565c0; }
.badge.savings   { background: #e8fdf4; color: #0d6640; }
.badge.approved  { background: #e8fdf4; color: #0d6640; }
.badge.pending   { background: #fff8e1; color: #b07d00; }
.badge.active    { background: #e8fdf4; color: #0d6640; }
.badge.inactive  { background: #fdecea; color: #b42318; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  border: 1px solid #c9d4d8;
  border-radius: 6px;
  padding: 8px 18px;
  background: white;
  color: #14323f;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) { background: #14323f; color: white; border-color: #14323f; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info { color: #5b7a85; font-size: 0.9rem; min-width: 120px; text-align: center; }

.status-msg { padding: 20px; color: #5b7a85; }
.status-msg.error { color: #b42318; }
</style>
