import { create } from 'zustand'
import api from '../api/api'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type PlayerMode = 'write' | 'select'

export interface VideoItem {
  id: string
  title: string
  videoUrl: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  language: string
}

export interface SafeBlank {
  wordIndex: number
  displayText: string
  options?: string[]
}

export interface SafeSegment {
  start: number
  end: number
  text: string
  blanks: SafeBlank[]
}

interface VideoStore {
  // Lista
  videos: VideoItem[]
  videosLoading: boolean

  // Video activo en el player
  activeVideo: VideoItem | null
  transcript: SafeSegment[]
  transcriptStatus: 'idle' | 'loading' | 'processing' | 'ready' | 'error'

  // Configuración del player
  difficulty: Difficulty
  mode: PlayerMode
  setDifficulty: (d: Difficulty) => void
  setMode: (m: PlayerMode) => void

  // Acciones
  fetchVideos: () => Promise<void>
  uploadVideo: (file: File, title: string, lyrics?: string) => Promise<VideoItem | null>
  setActiveVideo: (video: VideoItem) => void
  pollTranscript: (videoId: string, difficulty?: Difficulty, mode?: PlayerMode) => Promise<void>
  checkAnswer: (
    videoId: string,
    segmentIndex: number,
    blankIndex: number,
    answer: string,
  ) => Promise<{ correct: boolean; correctWord?: string }>
  reset: () => void
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  videosLoading: false,
  activeVideo: null,
  transcript: [],
  transcriptStatus: 'idle',
  difficulty: 'medium',
  mode: 'write',

  setDifficulty: (difficulty) => set({ difficulty }),
  setMode: (mode) => set({ mode }),

  fetchVideos: async () => {
    set({ videosLoading: true })
    try {
      const data = await api.get<any[]>('videos')
      const videos: VideoItem[] = data.map((v) => ({
        id: v._id ?? v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        status: v.status,
        language: v.language ?? 'en',
      }))
      set({ videos, videosLoading: false })
    } catch {
      set({ videosLoading: false })
    }
  },

  uploadVideo: async (file, title, lyrics) => {
    const fd = new FormData()
    fd.append('video', file)
    fd.append('title', title)
    if (lyrics?.trim()) {
      fd.append('lyrics', lyrics.trim())
    }
    try {
      const res = await api.post<{ id: string; title: string; status: string; message: string }>(
        'videos/upload',
        fd,
      )
      const newVideo: VideoItem = {
        id: (res as any)._id ?? res.id,
        title: res.title,
        videoUrl: '',
        status: res.status as VideoItem['status'],
        language: 'en',
      }
      set((s) => ({ videos: [newVideo, ...s.videos] }))
      return newVideo
    } catch {
      return null
    }
  },

  setActiveVideo: (video) => {
    const { difficulty, mode } = get()
    set({ activeVideo: video, transcript: [], transcriptStatus: 'loading' })
    get().pollTranscript(video.id, difficulty, mode)
  },

  pollTranscript: async (videoId, difficulty, mode) => {
    // Usar los valores del store si no se pasan explícitamente
    const d = difficulty ?? get().difficulty
    const m = mode ?? get().mode

    const poll = async () => {
      try {
        const data = await api.get<{ status: string; transcript: SafeSegment[] | null }>(
          `videos/${videoId}/transcript?difficulty=${d}&mode=${m}`,
        )

        if (data.status === 'ready' && data.transcript) {
          set({ transcript: data.transcript, transcriptStatus: 'ready' })
        } else if (data.status === 'error') {
          set({ transcriptStatus: 'error' })
        } else {
          set({ transcriptStatus: 'processing' })
          setTimeout(poll, 5000)
        }
      } catch (err) {
        console.error('Error al pedir transcript:', err)
        set({ transcriptStatus: 'error' })
      }
    }
    poll()
  },

  checkAnswer: async (videoId, segmentIndex, blankIndex, answer) => {
    try {
      return await api.post<{ correct: boolean; correctWord?: string }>(`videos/${videoId}/check`, {
        segmentIndex,
        blankIndex,
        answer,
      })
    } catch {
      return { correct: false }
    }
  },

  reset: () =>
    set({
      activeVideo: null,
      transcript: [],
      transcriptStatus: 'idle',
    }),
}))
