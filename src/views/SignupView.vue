<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const username = ref('')
const email = ref('')
const password = ref('')

const handleSignup = async () => {
  await store.signup(username.value, email.value, password.value)
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900 text-cyan-500">
    <form @submit.prevent="handleSignup" class="bg-gray-800 p-6 rounded-lg shadow-md w-80">
      <h2 class="text-2xl font-bold mb-4 text-center">Crear cuenta</h2>

      <input
        v-model="username"
        type="text"
        placeholder="Nombre completo"
        class="w-full p-2 mb-3 rounded text-black"
      />
      <input
        v-model="email"
        type="email"
        placeholder="Correo electrónico"
        class="w-full p-2 mb-3 rounded text-black"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Contraseña"
        class="w-full p-2 mb-3 rounded text-black"
      />

      <button
        type="submit"
        class="w-full bg-green-600 hover:bg-green-700 p-2 rounded transition-colors"
        :disabled="store.loading"
      >
        {{ store.loading ? 'Registrando...' : 'Registrarse' }}
      </button>

      <p v-if="store.error" class="text-red-400 text-sm mt-2 text-center">{{ store.error }}</p>
    </form>
  </div>
</template>
