<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';

const message = ref('');

onMounted(async () => {
  try {
    const res = await axios.get('/api/hello');
    message.value = res.data.message;
  } catch (error) {
    console.error('Chyba při načítání dat:', error);
    message.value = 'Chyba při komunikaci se serverem';
  }
});
</script>

<template>
  <div>
    <h1>Vítejte v Trackeru</h1>
    <p>Zpráva ze serveru: {{ message }}</p>
  </div>
</template>
