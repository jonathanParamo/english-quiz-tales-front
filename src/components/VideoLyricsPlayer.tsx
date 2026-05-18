import { useState, useRef, useEffect, useCallback } from 'react'
import {
  useVideoStore,
  type SafeSegment,
  type Difficulty,
  type PlayerMode,
} from '../store/useVideoStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnswerState {
  [key: string]: { value: string; correct: boolean | null; revealed: boolean }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color, fontSize: 11 }}> {icon}</span>
      <span className="font-mono uppercase tracking-widest" style={{ color, fontSize: 9 }}>
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: `linear-gradient(90deg,${color}30,transparent)` }}
      />
    </div>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Summary Box ──────────────────────────────────────────────────────────────

function SummaryBox({ videoId, initial }: { videoId: string; initial: string | null }) {
  const { saveSummary } = useVideoStore()
  const [text, setText] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(!initial)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSave = async () => {
    setSaving(true)
    const ok = await saveSummary(videoId, text)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setEditing(false)
      timerRef.current = setTimeout(() => setSaved(false), 2500)
    }
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(124,92,252,0.12)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#a78bfa', fontSize: 12 }}>✎</span>
          <span
            className="font-mono uppercase tracking-widest"
            style={{ color: 'rgba(167,139,250,0.6)', fontSize: 9 }}
          >
            My Summary
          </span>
          <span className="font-mono" style={{ color: 'rgba(255,255,255,0.12)', fontSize: 9 }}>
            · optional · in English
          </span>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="font-mono uppercase tracking-widest transition-all"
            style={{
              color: 'rgba(167,139,250,0.4)',
              fontSize: 9,
              border: '1px solid rgba(124,92,252,0.15)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a78bfa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(167,139,250,0.4)'
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write what you understood from this song… What's it about? How does it make you feel?"
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl p-3 font-body text-sm leading-relaxed resize-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(124,92,252,0.2)',
                color: 'rgba(255,255,255,0.65)',
                outline: 'none',
                fontSize: 13,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(124,92,252,0.5)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(124,92,252,0.2)'
              }}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono" style={{ color: 'rgba(255,255,255,0.12)', fontSize: 9 }}>
                {text.length}/1000
              </span>
              <div className="flex gap-2">
                {initial && (
                  <button
                    onClick={() => {
                      setText(initial)
                      setEditing(false)
                    }}
                    className="font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      color: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontSize: 9,
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="font-mono uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg,#7c5cfc,#5a3fd4)',
                    color: 'white',
                    border: '1px solid rgba(167,139,250,0.2)',
                    fontSize: 9,
                  }}
                >
                  {saving && (
                    <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            {text ? (
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, whiteSpace: 'pre-wrap' }}
              >
                {text}
              </p>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-4 rounded-xl font-mono uppercase tracking-widest transition-all"
                style={{
                  color: 'rgba(124,92,252,0.35)',
                  border: '1px dashed rgba(124,92,252,0.15)',
                  fontSize: 10,
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,92,252,0.35)'
                  e.currentTarget.style.color = '#a78bfa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,92,252,0.15)'
                  e.currentTarget.style.color = 'rgba(124,92,252,0.35)'
                }}
              >
                + Add your understanding of this song
              </button>
            )}
            {saved && (
              <p className="font-mono mt-2" style={{ color: '#34d399', fontSize: 9 }}>
                ✓ Saved
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Segment Row (cloze / lyrics) ─────────────────────────────────────────────

function SegmentRow({
  seg,
  segIdx,
  isActive,
  mode,
  answers,
  onAnswer,
  onCheck,
  onReveal,
  videoId,
}: {
  seg: SafeSegment
  segIdx: number
  isActive: boolean
  mode: PlayerMode
  answers: AnswerState
  onAnswer: (key: string, val: string) => void
  onCheck: (segIdx: number, blankIdx: number, answer: string) => void
  onReveal: (key: string, word: string) => void
  videoId: string
}) {
  const words = seg.text.split(/\s+/)
  const blankMap = new Map(seg.blanks.map((b) => [b.wordIndex, b]))

  return (
    <div
      className="rounded-xl px-4 py-3 transition-all duration-300"
      style={{
        background: isActive ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.04)'}`,
        boxShadow: isActive ? '0 0 20px rgba(124,92,252,0.06)' : 'none',
      }}
    >
      {/* Timestamp */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono"
          style={{ color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.15)', fontSize: 9 }}
        >
          {formatTime(seg.start)}
        </span>
        {isActive && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }}
          />
        )}
      </div>

      {/* Words + blanks */}
      <div className="flex flex-wrap gap-x-1.5 gap-y-2 items-baseline">
        {words.map((word, wi) => {
          const blank = blankMap.get(wi)
          if (!blank) {
            return (
              <span
                key={wi}
                className="font-mono"
                style={{
                  color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                  fontSize: 14,
                }}
              >
                {word}
              </span>
            )
          }

          const blankIdx = seg.blanks.indexOf(blank)
          const key = `${segIdx}-${blankIdx}`
          const state = answers[key]

          if (state?.revealed) {
            return (
              <span
                key={wi}
                className="font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: '#f59e0b',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: 14,
                }}
              >
                {state.value}
              </span>
            )
          }

          if (state?.correct === true) {
            return (
              <span
                key={wi}
                className="font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: '#34d399',
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  fontSize: 14,
                }}
              >
                {state.value}
              </span>
            )
          }

          if (mode === 'select' && blank.options) {
            return (
              <div key={wi} className="inline-flex flex-wrap gap-1">
                {blank.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onAnswer(key, opt)
                      onCheck(segIdx, blankIdx, opt)
                    }}
                    className="font-mono px-2 py-0.5 rounded-lg transition-all"
                    style={{
                      background:
                        state?.correct === false && state.value === opt
                          ? 'rgba(244,63,94,0.12)'
                          : 'rgba(124,92,252,0.08)',
                      border: `1px solid ${state?.correct === false && state.value === opt ? 'rgba(244,63,94,0.3)' : 'rgba(124,92,252,0.2)'}`,
                      color:
                        state?.correct === false && state.value === opt
                          ? 'rgba(244,63,94,0.7)'
                          : 'rgba(167,139,250,0.8)',
                      fontSize: 12,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )
          }

          // Write mode
          return (
            <div key={wi} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={state?.value ?? ''}
                onChange={(e) => onAnswer(key, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCheck(segIdx, blankIdx, state?.value ?? '')
                }}
                placeholder={'_'.repeat(Math.max(blank.displayText.split('_').join('').length, 4))}
                className="font-mono rounded-lg px-2 py-0.5 text-center transition-all"
                style={{
                  width: `${Math.max((state?.value?.length ?? 0) + 4, 8)}ch`,
                  background:
                    state?.correct === false ? 'rgba(244,63,94,0.08)' : 'rgba(124,92,252,0.06)',
                  border: `1px solid ${state?.correct === false ? 'rgba(244,63,94,0.3)' : 'rgba(124,92,252,0.25)'}`,
                  color: state?.correct === false ? 'rgba(244,63,94,0.8)' : 'rgba(167,139,250,0.9)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {state?.value && state.correct === null && (
                <button
                  onClick={() => onCheck(segIdx, blankIdx, state.value)}
                  className="font-mono px-1.5 py-0.5 rounded transition-all"
                  style={{
                    color: '#a78bfa',
                    background: 'rgba(124,92,252,0.1)',
                    border: '1px solid rgba(124,92,252,0.2)',
                    fontSize: 9,
                  }}
                >
                  ✓
                </button>
              )}
              {state?.correct === false && (
                <button
                  onClick={() => onReveal(key, '')}
                  className="font-mono px-1.5 py-0.5 rounded transition-all"
                  style={{
                    color: 'rgba(245,158,11,0.7)',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    fontSize: 9,
                  }}
                >
                  ?
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function VideoLyricsPlayer() {
  const {
    activeVideo,
    transcript,
    transcriptStatus,
    difficulty,
    mode,
    setDifficulty,
    setMode,
    pollTranscript,
    checkAnswer,
  } = useVideoStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [activeSegIdx, setActiveSegIdx] = useState<number>(-1)
  const segRefs = useRef<(HTMLDivElement | null)[]>([])

  // Sync active segment with video time
  useEffect(() => {
    if (!transcript.length) return
    const idx = transcript.findIndex((s) => currentTime >= s.start && currentTime < s.end)
    if (idx !== -1 && idx !== activeSegIdx) {
      setActiveSegIdx(idx)
      // Auto-scroll to active segment
      segRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentTime, transcript])

  // Re-fetch transcript when difficulty/mode changes
  useEffect(() => {
    if (activeVideo && transcriptStatus === 'ready') {
      pollTranscript(activeVideo.id, difficulty, mode)
      setAnswers({})
    }
  }, [difficulty, mode])

  const handleAnswer = useCallback((key: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: { value: val, correct: null, revealed: false },
    }))
  }, [])

  const handleCheck = useCallback(
    async (segIdx: number, blankIdx: number, answer: string) => {
      if (!activeVideo) return
      const key = `${segIdx}-${blankIdx}`
      const res = await checkAnswer(activeVideo.id, segIdx, blankIdx, answer)
      setAnswers((prev) => ({
        ...prev,
        [key]: {
          value: answer,
          correct: res.correct,
          revealed: false,
        },
      }))
      // If wrong, optionally reveal after a bit
    },
    [activeVideo, checkAnswer],
  )

  const handleReveal = useCallback(
    async (key: string, _word: string) => {
      if (!activeVideo) return
      const [segIdx, blankIdx] = key.split('-').map(Number)
      const res = await checkAnswer(activeVideo.id, segIdx, blankIdx, '')
      if (res.correctWord) {
        setAnswers((prev) => ({
          ...prev,
          [key]: { value: res.correctWord!, correct: false, revealed: true },
        }))
      }
    },
    [activeVideo, checkAnswer],
  )

  const jumpToSegment = (seg: SafeSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seg.start
      videoRef.current.play().catch(() => {})
    }
  }

  if (!activeVideo) return null

  const score = Object.values(answers).length
    ? Math.round(
        (Object.values(answers).filter((a) => a.correct === true).length /
          Object.values(answers).length) *
          100,
      )
    : null

  const totalBlanks = transcript.reduce((acc, s) => acc + s.blanks.length, 0)
  const answeredBlanks = Object.keys(answers).length

  return (
    <div className="space-y-5">
      {/* ── Video Player ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#000', border: '1px solid rgba(124,92,252,0.15)' }}
      >
        <video
          ref={videoRef}
          src={activeVideo.videoUrl}
          controls
          className="w-full"
          style={{ maxHeight: 280, display: 'block' }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        />
      </div>

      {/* ── Controls ── */}
      <div
        className="rounded-2xl p-4 space-y-4"
        style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(124,92,252,0.1)' }}
      >
        {/* Difficulty */}
        <div>
          <p
            className="font-mono uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
          >
            Difficulty
          </p>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const colors: Record<Difficulty, string> = {
                easy: '#34d399',
                medium: '#f59e0b',
                hard: '#f43f5e',
              }
              const active = difficulty === d
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="flex-1 py-2 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    background: active ? `${colors[d]}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${colors[d]}40` : 'rgba(255,255,255,0.07)'}`,
                    color: active ? colors[d] : 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p
            className="font-mono uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
          >
            Answer Mode
          </p>
          <div className="flex gap-2">
            {(['write', 'select'] as PlayerMode[]).map((m) => {
              const active = mode === m
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    background: active ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                  }}
                >
                  {m === 'write' ? '✎ Write' : '◎ Select'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Progress */}
        {totalBlanks > 0 && (
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(answeredBlanks / totalBlanks) * 100}%`,
                  background:
                    score !== null && score >= 75
                      ? '#34d399'
                      : score !== null && score >= 50
                        ? '#f59e0b'
                        : '#7c5cfc',
                }}
              />
            </div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
              {answeredBlanks}/{totalBlanks}
            </span>
            {score !== null && (
              <span
                className="font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  color: score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f43f5e',
                  background:
                    score >= 75
                      ? 'rgba(52,211,153,0.1)'
                      : score >= 50
                        ? 'rgba(245,158,11,0.1)'
                        : 'rgba(244,63,94,0.1)',
                  fontSize: 10,
                }}
              >
                {score}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Transcript ── */}
      <div>
        <SectionLabel icon="♪" label="Lyrics" color="#7c5cfc" />

        {transcriptStatus === 'loading' || transcriptStatus === 'processing' ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p
              className="font-mono uppercase tracking-widest"
              style={{ color: 'rgba(124,92,252,0.4)', fontSize: 10 }}
            >
              {transcriptStatus === 'loading' ? 'Loading lyrics…' : 'Processing audio…'}
            </p>
          </div>
        ) : transcriptStatus === 'error' ? (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <p className="font-mono" style={{ color: 'rgba(244,63,94,0.7)', fontSize: 11 }}>
              ⚠ Error loading transcript
            </p>
          </div>
        ) : transcript.length === 0 ? (
          <p className="font-mono" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            No transcript available yet.
          </p>
        ) : (
          <div className="space-y-2">
            {transcript.map((seg, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  segRefs.current[idx] = el
                }}
                onClick={() => jumpToSegment(seg)}
                style={{ cursor: 'pointer' }}
              >
                <SegmentRow
                  seg={seg}
                  segIdx={idx}
                  isActive={activeSegIdx === idx}
                  mode={mode}
                  answers={answers}
                  onAnswer={handleAnswer}
                  onCheck={handleCheck}
                  onReveal={handleReveal}
                  videoId={activeVideo.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── User Summary ── */}
      <div>
        <SectionLabel icon="✎" label="My Notes" color="rgba(167,139,250,0.5)" />
        <SummaryBox videoId={activeVideo.id} initial={activeVideo.userSummary ?? null} />
      </div>
    </div>
  )
}
