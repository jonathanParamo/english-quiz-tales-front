<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import QuestionItem from '../components/QuestionItem.vue'
import ResultModal from '../components/ResultModal.vue'

const route = useRoute()
const storyId = route.params.id as string

const story = ref<any>(null)
const images = ref<string[]>([])
const questions = ref<any[]>([])
const showStory = ref(false)
const storyPenaltyApplied = ref(false)
const audioPlayer = ref<HTMLAudioElement | null>(null)

const result = ref<{ correct: number; incorrect: number; totalScore: number } | null>(null)
const isModalOpen = ref(false)

onMounted(async () => {
  try {
    const storyRes = await api.get(`stories/${storyId}`)
    story.value = storyRes.data
    images.value = story.value.images || []

    const questionsRes = await api.get(`questions/${storyId}/random/10`)
    questions.value = questionsRes.data.map((q: any) => {
      let selectedValue = q.selected

      if (typeof selectedValue === 'string') {
        try {
          const parsed = JSON.parse(selectedValue)
          if (Array.isArray(parsed)) selectedValue = parsed
        } catch {
          /* ignorar errores de parseo */
        }
      }

      return {
        ...q,
        selected: selectedValue || '',
        type: q.type || 'multiple', // aseguramos el campo "type"
      }
    })
  } catch (err) {
    console.error('❌ Error fetching story or questions:', err)
  }
})

const playAudio = () => audioPlayer.value?.play()
const pauseAudio = () => audioPlayer.value?.pause()
const rewind = () => {
  if (audioPlayer.value) audioPlayer.value.currentTime -= 5
}
const fastForward = () => {
  if (audioPlayer.value) audioPlayer.value.currentTime += 5
}
const setSpeed = (speed: number) => {
  if (audioPlayer.value) audioPlayer.value.playbackRate = speed
}

const revealStory = () => {
  showStory.value = true
  storyPenaltyApplied.value = true
}

const submitAnswers = async () => {
  try {
    const answers = questions.value.map((q) => ({
      questionId: q._id,
      type: q.type || 'multiple',
      selected: q.selected || '',
    }))

    const payload = {
      storyId,
      answers,
      penalty: storyPenaltyApplied.value,
    }

    const res = await api.post('questions/grade', payload)
    const data = res.data
    result.value = {
      correct: data.correct,
      incorrect: data.incorrect,
      totalScore: data.totalScore,
    }
    isModalOpen.value = true
  } catch (err: any) {
    alert('Error al enviar las respuestas. Revisa la consola.')
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Título -->
    <h1 class="text-4xl font-extrabold mb-6 text-center text-gray-900 dark:text-white">
      {{ story?.title }}
    </h1>

    <!-- 🎵 Audio -->
    <div class="mb-6 flex flex-col items-center justify-center gap-4">
      <audio
        ref="audioPlayer"
        :src="story?.audioUrl"
        controls
        controlsList="nodownload"
        class="w-full md:w-2/3 rounded-lg shadow-lg"
      ></audio>
      <div class="flex flex-wrap gap-2 justify-center mt-2 md:mt-0">
        <button
          @click="rewind"
          class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          ⏪ 5s
        </button>
        <button
          @click="playAudio"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          ▶️
        </button>
        <button
          @click="pauseAudio"
          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          ⏸️
        </button>
        <button
          @click="fastForward"
          class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          ⏩ 5s
        </button>
        <button
          @click="setSpeed(0.5)"
          class="px-2 py-1 bg-cyan-300 rounded hover:bg-gray-400 transition"
        >
          0.5x
        </button>
        <button
          @click="setSpeed(1)"
          class="px-2 py-1 bg-cyan-500 rounded hover:bg-gray-400 transition"
        >
          1x
        </button>
        <button
          @click="setSpeed(1.5)"
          class="px-2 py-1 bg-cyan-600 rounded hover:bg-gray-400 transition"
        >
          1.5x
        </button>
        <button
          @click="setSpeed(2)"
          class="px-2 py-1 bg-cyan-800 rounded hover:bg-gray-400 transition"
        >
          2x
        </button>
      </div>
    </div>

    <!-- 📖 Mostrar historia -->
    <button
      v-if="!showStory"
      @click="revealStory"
      class="mb-6 px-4 py-2 bg-purple-600 text-white font-semibold rounded shadow hover:bg-purple-700 transition"
    >
      Mostrar Historia (¡Perderás puntos!)
    </button>

    <div
      v-if="showStory && story"
      class="mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 leading-relaxed"
    >
      <p class="mb-4 first-letter:text-5xl first-letter:font-bold first-letter:text-purple-600">
        {{ story.text }}
      </p>

      <!-- Ejemplo de imágenes flotando con texto -->
      <div
        v-for="(img, i) in images"
        :key="i"
        :class="
          i % 2 === 0
            ? 'float-left mr-4 mb-4 w-1/2 rounded-lg shadow-lg transform hover:scale-105 transition'
            : 'float-right ml-4 mb-4 w-1/2 rounded-lg shadow-lg transform hover:scale-105 transition'
        "
      >
        <img :src="img" class="w-full h-auto object-cover rounded-lg" />
      </div>
      <div class="clear-both"></div>
    </div>

    <!-- 🖼️ Preguntas -->
    <div v-if="questions.length" class="space-y-6">
      <QuestionItem v-for="q in questions" :key="q._id" :question="q" />

      <button
        @click="submitAnswers"
        class="mt-4 w-full md:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition"
      >
        Enviar respuestas
      </button>
    </div>

    <!-- Modal de resultados -->
    <ResultModal
      v-if="result"
      :isOpen="isModalOpen"
      :correct="result.correct"
      :incorrect="result.incorrect"
      :totalScore="result.totalScore"
      :onClose="() => (isModalOpen = false)"
    />
  </div>
</template>
