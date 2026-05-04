<template>
  <main class="dashboard">
    <header>
      <div>
        <p class="eyebrow">Account</p>
        <h1>Welcome{{ username ? `, ${username}` : '' }}</h1>
      </div>
      <button type="button" @click="handleLogout">Logout</button>
    </header>

    <section>
      <h2>Login successful</h2>
      <p>Your frontend is connected to the Spring Boot backend.</p>
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

onMounted(async () => {
  try {
    const response = await api.get('/api/me')
    username.value = response.data.username
  } catch {
    userStore.logout()
    router.push('/login')
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
  color: #14323f;
  background: #f4f7f8;
  padding: 32px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto 24px;
  max-width: 920px;
}

.eyebrow,
h1,
h2,
p {
  margin: 0;
}

.eyebrow {
  color: #126660;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin-top: 4px;
  font-size: 2rem;
}

button {
  border: 0;
  border-radius: 6px;
  padding: 0.72rem 1rem;
  color: white;
  background: #126660;
  font-weight: 750;
  cursor: pointer;
}

section {
  max-width: 920px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid #dce5e8;
  border-radius: 8px;
  background: white;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

section p {
  color: #5b6b72;
}

@media (max-width: 620px) {
  .dashboard {
    padding: 20px;
  }

  header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
