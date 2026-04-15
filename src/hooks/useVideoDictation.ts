import { useState, useRef, useCallback, useEffect } from 'react'
import { useVideoStore, SafeSegment } from '../store/useVideoStore'

export type AnswerStatus = 'pending' | 'correct' | 'wrong' | 'missed' | 'revealed'

export interface SegmentAnswer {
  input: string
  status: AnswerStatus
  correctWord?: string
}

export type AnswerMap = Record<number, Record<number, SegmentAnswer>>

export interface SessionResults {
  correct: number
  wrong: number
  missed: number
  total: number
  answers: AnswerMap
}

const REWIND_SECONDS = 10

export function useVideoDictation(videoId: string) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { transcript, transcriptStatus, checkAnswer, mode } = useVideoStore()

  const [activeSegment, setActiveSegment] = useState(-1)
  const [isPaused, setIsPaused] = useState(true)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [currentInput, setCurrentInput] = useState('')
  const [isFinished, setIsFinished] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null)

  const prevSegmentRef = useRef(-1)
  const answersRef = useRef<AnswerMap>({})
  const transcriptRef = useRef<SafeSegment[]>([])
  const activeSegmentRef = useRef(-1)
  const isPausedForBlankRef = useRef(false)
  const pausedSegmentsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    answersRef.current = answers
  }, [answers])
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])
  useEffect(() => {
    activeSegmentRef.current = activeSegment
  }, [activeSegment])

  // ── setAnswer ──────────────────────────────────────────────────────────
  const setAnswer = useCallback(
    (segIdx: number, blankIdx: number, answer: Partial<SegmentAnswer>) => {
      setAnswers((prev) => {
        const existing = prev[segIdx]?.[blankIdx]
        const updated: SegmentAnswer = {
          input: existing?.input ?? '',
          status: existing?.status ?? 'pending',
          correctWord: existing?.correctWord,
          ...answer,
        }
        return {
          ...prev,
          [segIdx]: { ...prev[segIdx], [blankIdx]: updated },
        }
      })
    },
    [],
  )

  const resumeVideo = useCallback(() => {
    isPausedForBlankRef.current = false
    const video = videoRef.current
    if (video && video.paused) {
      video.play().catch(() => {})
      setIsPaused(false)
    }
  }, [])

  const pauseForBlank = useCallback((segIdx: number, blankIdx: number) => {
    const video = videoRef.current
    if (!video) return

    const existing = answersRef.current[segIdx]?.[blankIdx]
    if (existing && existing.status !== 'pending') return

    isPausedForBlankRef.current = true
    video.pause()
    setIsPaused(true)
  }, [])

  // ── timeupdate ─────────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || transcriptRef.current.length === 0) return

    if (isPausedForBlankRef.current) return

    const t = video.currentTime

    const idx = transcriptRef.current.findIndex((seg) => t >= seg.start && t < seg.end)

    if (idx !== prevSegmentRef.current) {
      prevSegmentRef.current = idx
      setActiveSegment(idx)
      setCurrentInput('')
    }

    if (idx >= 0) {
      const seg = transcriptRef.current[idx]
      if (!seg || seg.blanks.length === 0) return

      if (pausedSegmentsRef.current.has(idx)) return

      const progress = (t - seg.start) / (seg.end - seg.start)

      if (progress > 0.95) {
        const firstPending = seg.blanks.findIndex((_, bIdx) => {
          const ans = answersRef.current[idx]?.[bIdx]
          return !ans || ans.status === 'pending'
        })

        if (firstPending >= 0) {
          pausedSegmentsRef.current.add(idx)
          pauseForBlank(idx, firstPending)
        }
      }
    }
  }, [pauseForBlank])

  const handleVideoEnded = useCallback(async () => {
    isPausedForBlankRef.current = false

    const lastSeg = activeSegmentRef.current
    if (lastSeg >= 0) {
      const seg = transcriptRef.current[lastSeg]
      if (seg) {
        for (let bIdx = 0; bIdx < seg.blanks.length; bIdx++) {
          const existing = answersRef.current[lastSeg]?.[bIdx]
          if (!existing || existing.status === 'pending') {
            const input = existing?.input ?? ''
            const result = await checkAnswer(videoId, lastSeg, bIdx, input.trim())
            setAnswer(lastSeg, bIdx, {
              status: input.trim() ? (result.correct ? 'correct' : 'wrong') : 'missed',
              correctWord: result.correctWord,
            })
          }
        }
      }
    }

    setTimeout(() => {
      const finalAnswers = answersRef.current
      let correct = 0,
        wrong = 0,
        missed = 0,
        total = 0

      transcriptRef.current.forEach((seg, sIdx) => {
        seg.blanks.forEach((_, bIdx) => {
          total++
          const ans = finalAnswers[sIdx]?.[bIdx]
          if (!ans || ans.status === 'missed') missed++
          else if (ans.status === 'correct') correct++
          else wrong++
        })
      })

      setSessionResults({ correct, wrong, missed, total, answers: finalAnswers })
      setIsFinished(true)
    }, 300)
  }, [videoId, checkAnswer, setAnswer])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleVideoEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleVideoEnded)
    }
  }, [handleTimeUpdate, handleVideoEnded])

  useEffect(() => {
    if (transcriptStatus === 'ready' && videoRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPaused(false)
    }
  }, [transcriptStatus])

  const submitWrite = useCallback(
    async (segIdx: number, blankIdx: number, input: string) => {
      if (!input.trim()) return
      const result = await checkAnswer(videoId, segIdx, blankIdx, input.trim())
      setAnswer(segIdx, blankIdx, {
        input: input.trim(),
        status: result.correct ? 'correct' : 'wrong',
        correctWord: result.correct ? undefined : result.correctWord,
      })

      if (result.correct) {
        setCurrentInput('')
        const seg = transcriptRef.current[segIdx]
        if (seg) {
          const nextPending = seg.blanks.findIndex((_, bIdx) => {
            if (bIdx <= blankIdx) return false
            const ans = answersRef.current[segIdx]?.[bIdx]
            return !ans || ans.status === 'pending'
          })
          if (nextPending >= 0) {
            pauseForBlank(segIdx, nextPending)
          } else {
            resumeVideo()
          }
        } else {
          resumeVideo()
        }
      }
    },
    [videoId, checkAnswer, setAnswer, resumeVideo, pauseForBlank],
  )

  // ── Submit SELECT ──────────────────────────────────────────────────────
  const submitSelect = useCallback(
    async (segIdx: number, blankIdx: number, option: string) => {
      const result = await checkAnswer(videoId, segIdx, blankIdx, option)
      setAnswer(segIdx, blankIdx, {
        input: option,
        status: result.correct ? 'correct' : 'wrong',
        correctWord: result.correct ? undefined : result.correctWord,
      })

      const seg = transcriptRef.current[segIdx]
      if (seg) {
        const nextPending = seg.blanks.findIndex((_, bIdx) => {
          if (bIdx <= blankIdx) return false
          const ans = answersRef.current[segIdx]?.[bIdx]
          return !ans || ans.status === 'pending'
        })
        if (nextPending >= 0) {
          pauseForBlank(segIdx, nextPending)
        } else {
          resumeVideo()
        }
      } else {
        resumeVideo()
      }
    },
    [videoId, checkAnswer, setAnswer, resumeVideo, pauseForBlank],
  )

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (isPausedForBlankRef.current) return
    if (video.paused) {
      video.play()
      setIsPaused(false)
    } else {
      video.pause()
      setIsPaused(true)
    }
  }, [])

  const rewind = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    pausedSegmentsRef.current.clear()

    prevSegmentRef.current = -1
    video.currentTime = Math.max(0, video.currentTime - REWIND_SECONDS)
    video.play().catch(() => {})
    setIsPaused(false)
  }, [])

  const dismissResults = useCallback(() => {
    setIsFinished(false)
    setSessionResults(null)
  }, [])

  return {
    videoRef,
    transcript,
    transcriptStatus,
    activeSegment,
    isPaused,
    isPausedForBlank: isPausedForBlankRef.current,
    answers,
    currentInput,
    setCurrentInput,
    submitWrite,
    submitSelect,
    togglePlay,
    rewind,
    rewindSeconds: REWIND_SECONDS,
    mode,
    isFinished,
    sessionResults,
    dismissResults,
  }
}
