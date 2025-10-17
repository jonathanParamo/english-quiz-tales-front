<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const stories = ref<any[]>([])

onMounted(async () => {
  try {
    const res = await api.get('stories/available')
    stories.value = res.data
  } catch (err) {
    console.error('Error fetching stories:', err)
  }
})

const goToStory = (id: string) => {
  router.push(`/story/${id}`)
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4">Available Stories</h1>
    <ul>
      <li
        v-for="story in stories"
        :key="story.id"
        @click="goToStory(story.id)"
        class="cursor-pointer mb-2 p-3 bg-gray-700 rounded hover:bg-indigo-600 transition"
      >
        {{ story.title }} ({{ story.level }})
      </li>
    </ul>
  </div>
</template>
