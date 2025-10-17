<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded shadow-lg w-96 text-cyan-800 flex justify-center">
      <div class="w-full flex flex-col justify-center">
        <h2 class="text-[24px] font-bold mb-4 w-full flex justify-center">Resultados</h2>
        <p class="w-full mt-2 pl-4 bg-green-500 text-lg text-green-100">
          Aciertos: <a class="ml-4">{{ correct }}</a>
        </p>
        <p class="w-3/2 mt-2 pl-4 bg-red-800 text-lg text-red-100">
          Errores: <a class="ml-6">{{ incorrect }}</a>
        </p>
        <p class="mt-2 bg-black pl-4 text-lg text-white">
          Puntaje: <a class="ml-5"> {{ totalScore }}</a>
        </p>
        <button @click="close" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  isOpen: boolean
  correct: number
  incorrect: number
  totalScore: number
  onClose: () => void
}>()

const close = () => {
  props.onClose()
}
</script>
