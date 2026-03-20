<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';

const message = ref('');
const loading = ref(true);
const error = ref(null);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get('/api/hello');
    message.value = res.data.message;
  } catch (err) {
    console.error('Chyba při načítání dat:', err);
    error.value = 'Nepodařilo se spojit se serverem.';
    message.value = 'Chyba připojení';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="container">
    <main class="card">
      <h1>Tracker App</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">
        Moderní aplikace propojená s Express serverem
      </p>

      <div class="message-box">
        <span class="message-label">Odpověď ze serveru</span>
        <div v-if="loading" class="message-content" style="color: var(--text-muted)">
          Načítám data...
        </div>
        <div v-else :class="['message-content', { 'error-text': error }]">
          {{ message }}
        </div>
      </div>

      <div v-if="!loading && !error" class="status-badge">
        <span style="width: 8px; height: 8px; background: var(--success-color); border-radius: 50%;"></span>
        Server je online
      </div>

      <button @click="fetchData" class="btn" :disabled="loading">
        {{ loading ? 'Aktualizuji...' : 'Zkusit znovu' }}
      </button>
    </main>
  </div>
</template>

<style scoped>
.error-text {
  color: #ef4444;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
