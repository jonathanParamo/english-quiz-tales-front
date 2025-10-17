<template>
  <div class="bg-gray-800 p-4 rounded shadow-md mb-4">
    <p class="font-semibold mb-2">{{ question.question }}</p>

    <!-- Audio si aplica -->
    <audio v-if="question.audioUrl" :src="question.audioUrl" controls class="mb-2"></audio>

    <!-- Selección múltiple -->
    <ul v-if="question.type === 'multiple'" class="space-y-2">
      <li
        v-for="(option, i) in question.options"
        :key="i"
        class="px-3 py-2 rounded cursor-pointer"
        :class="selectedOption === option ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-indigo-600'"
        @click="selectOption(option)"
      >
        {{ option }}
      </li>
    </ul>

    <!-- Verdadero/Falso -->
    <ul v-else-if="question.type === 'true_false'" class="space-y-2">
      <li
        v-for="option in ['True', 'False']"
        :key="option"
        class="px-3 py-2 rounded cursor-pointer"
        :class="selectedOption === option ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-indigo-600'"
        @click="selectOption(option)"
      >
        {{ option }}
      </li>
    </ul>

    <!-- Completar espacio o escribir oración -->
    <input
      v-else-if="['fill_blank', 'write_sentence'].includes(question.type)"
      v-model="typedAnswer"
      placeholder="Escribe tu respuesta..."
      class="w-full px-3 py-2 mt-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
    />

    <!-- Elegir la oración correcta -->
    <ul v-else-if="question.type === 'choose_correct_sentence'" class="space-y-2">
      <li
        v-for="(option, i) in question.options"
        :key="i"
        class="px-3 py-2 rounded cursor-pointer"
        :class="selectedOption === option ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-indigo-600'"
        @click="selectOption(option)"
      >
        {{ option }}
      </li>
    </ul>

    <!-- Matching (emparejar) -->
    <div v-else-if="question.type === 'matching'">
      <div v-for="(pair, i) in question.options" :key="i" class="flex gap-2 mb-2">
        <span class="bg-gray-700 p-2 rounded">{{ pair.left }}</span>
        <select v-model="selectedPairs[i]" class="bg-gray-600 p-1 rounded">
          <option disabled value="">Selecciona...</option>
          <option v-for="option in pair.rightOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps } from 'vue'

const props = defineProps<{ question: any }>()

// Para selección múltiple o verdadero/falso
const selectedOption = ref<string | null>(props.question.selected || null)

// Para fill in the blank
const typedAnswer = ref(props.question.selected || '')

// Para matching
const selectedPairs = ref<string[]>(props.question.options?.map(() => '') || [])

const selectOption = (option: string) => {
  selectedOption.value = option
  props.question.selected = option
}

watch(typedAnswer, (val) => {
  props.question.selected = val
})

watch(selectedPairs, (val) => {
  props.question.selected = val
})
</script>
