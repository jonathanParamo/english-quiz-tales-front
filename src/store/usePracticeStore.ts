import { create } from 'zustand'
import api from '../api/api'

export interface VerbEntry {
  infinitive: string
  pastSimple: string
  pastParticiple: string
  spanish: string
  example: string
}

export interface VocabEntry {
  word: string
  type: string
  definition: string
  spanish: string
  example: string
}

export interface PracticeDocument {
  _id: string
  originalName: string
  contentType: 'verbs' | 'vocabulary' | 'story' | 'mixed'
  title: string
  summary: string
  verbs: VerbEntry[]
  vocabulary: VocabEntry[]
  paragraphs: string[]
  createdAt: string
}

export interface WritingFeedback {
  score: number
  usedWords: string[]
  missedWords: string[]
  corrections: { original: string; suggestion: string; reason: string }[]
  summary: string
  encouragement: string
}

export interface GeneratedQuestion {
  text: string
  options: string[]
  correctAnswer: string
  points: number
  type: string
}

export type PracticeMode = 'listen' | 'vocabulary' | 'writing' | 'quiz'

interface PracticeState {
  // Documento activo
  document: PracticeDocument | null
  documentLoading: boolean

  // Modo activo
  activeMode: PracticeMode

  // Estado del quiz
  quizQuestions: GeneratedQuestion[]
  quizAnswers: Record<number, string>
  quizResult: { score: number; total: number; details: any[] } | null
  quizLoading: boolean

  // Estado de escritura
  writingText: string
  writingFeedback: WritingFeedback | null
  writingLoading: boolean

  // Sesión de tiempo (para guardar en progress)
  sessionStart: number | null

  // Acciones
  uploadDocument: (file: File) => Promise<PracticeDocument | null>
  setDocument: (doc: PracticeDocument) => void
  setActiveMode: (mode: PracticeMode) => void
  generateQuiz: (count?: 5 | 10 | 15, level?: string) => Promise<void>
  setQuizAnswer: (index: number, answer: string) => void
  submitQuiz: () => void
  setWritingText: (text: string) => void
  reviewWriting: () => Promise<void>
  saveSession: (mode: PracticeMode, extra?: Record<string, any>) => Promise<void>
  reset: () => void
}

// ── Store ──────────────────────────────────────────────────────────────────

export const usePracticeStore = create<PracticeState>((set, get) => ({
  document: null,
  documentLoading: false,
  activeMode: 'listen',
  quizQuestions: [],
  quizAnswers: {},
  quizResult: null,
  quizLoading: false,
  writingText: '',
  writingFeedback: null,
  writingLoading: false,
  sessionStart: null,

  uploadDocument: async (file: File) => {
    set({ documentLoading: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const doc = await api.post<PracticeDocument>('documents/upload', formData)
      set({ document: doc, documentLoading: false, activeMode: 'listen', sessionStart: Date.now() })
      return doc
    } catch (err) {
      set({ documentLoading: false })
      return null
    }
  },

  setDocument: (doc) => set({ document: doc, sessionStart: Date.now() }),

  setActiveMode: (mode) => {
    const prev = get().activeMode
    const start = get().sessionStart
    // Guardar sesión del modo anterior si duró más de 10s
    if (start && Date.now() - start > 10000) {
      get().saveSession(prev)
    }
    set({ activeMode: mode, sessionStart: Date.now() })
  },

  generateQuiz: async (count = 5, level = 'beginner') => {
    const doc = get().document
    if (!doc) return
    set({ quizLoading: true, quizAnswers: {}, quizResult: null })
    try {
      const res = await api.post<{ questions: GeneratedQuestion[] }>(`documents/${doc._id}/quiz`, {
        count,
        level,
      })
      set({ quizQuestions: res.questions, quizLoading: false })
    } catch {
      set({ quizLoading: false })
    }
  },

  setQuizAnswer: (index, answer) =>
    set((s) => ({ quizAnswers: { ...s.quizAnswers, [index]: answer } })),

  submitQuiz: () => {
    const { quizQuestions, quizAnswers } = get()
    let score = 0
    const details = quizQuestions.map((q, i) => {
      const selected = quizAnswers[i] ?? ''
      const correct = selected === q.correctAnswer
      if (correct) score++
      return { question: q.text, selected, correctAnswer: q.correctAnswer, correct }
    })
    set({ quizResult: { score, total: quizQuestions.length, details } })
    get().saveSession('quiz', { quizScore: score, quizTotal: quizQuestions.length })
  },

  setWritingText: (text) => set({ writingText: text, writingFeedback: null }),

  reviewWriting: async () => {
    const { document, writingText } = get()
    if (!document || !writingText.trim()) return
    set({ writingLoading: true })
    try {
      const fb = await api.post<WritingFeedback>(`documents/${document._id}/review-writing`, {
        text: writingText,
      })
      set({ writingFeedback: fb, writingLoading: false })
    } catch {
      set({ writingLoading: false })
    }
  },

  saveSession: async (mode, extra = {}) => {
    const { document, sessionStart } = get()
    if (!document || !sessionStart) return
    const durationSeconds = Math.round((Date.now() - sessionStart) / 1000)
    try {
      await api.post('progress/session', {
        documentId: document._id,
        mode,
        durationSeconds,
        ...extra,
      })
    } catch {
      /* silencioso */
    }
  },

  reset: () =>
    set({
      document: null,
      activeMode: 'listen',
      quizQuestions: [],
      quizAnswers: {},
      quizResult: null,
      writingText: '',
      writingFeedback: null,
      sessionStart: null,
    }),
}))
