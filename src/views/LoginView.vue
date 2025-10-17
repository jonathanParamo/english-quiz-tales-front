<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

const store = useUserStore()
const email = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = async () => {
  const success = await store.login(email.value, password.value)

  if (success) {
    router.push('/home')
  } else {
    store.error = 'Login fallido: credenciales inválidas'
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
    <form @submit.prevent="handleLogin" class="bg-gray-800 p-6 rounded-lg shadow-md w-80">
      <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>

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
        class="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors"
        :disabled="store.loading"
      >
        {{ store.loading ? 'Cargando...' : 'Iniciar sesión' }}
      </button>

      <p v-if="store.error" class="text-red-400 text-sm mt-2 text-center">{{ store.error }}</p>
    </form>
  </div>
</template>
