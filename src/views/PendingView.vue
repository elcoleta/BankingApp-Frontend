<template>
  <div class="pending-page">
    <div class="pending-card">
      <div class="icon">&#9203;</div>
      <h1>Account pending approval</h1>
      <p>
        Welcome! Your registration has been received. A bank employee will review your details
        and activate your account shortly.
      </p>
      <p class="hint">You will be able to access your dashboard once your account is approved.</p>
      <button @click="logout">Sign out</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.pending-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, #14415c, #126660);
  padding: 24px;
}

.pending-card {
  width: min(100%, 480px);
  padding: 40px 36px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 24px 70px rgba(4, 24, 34, 0.28);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.icon {
  font-size: 3rem;
  line-height: 1;
}

h1 {
  margin: 0;
  color: #14323f;
  font-size: 1.5rem;
}

p {
  margin: 0;
  color: #4b6270;
  line-height: 1.6;
  font-size: 0.97rem;
}

.hint {
  font-size: 0.87rem;
  color: #7a9aaa;
}

button {
  margin-top: 8px;
  border: 0;
  border-radius: 6px;
  padding: 0.75rem 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  color: white;
  background: #126660;
}

button:hover {
  background: #0e514d;
}
</style>
