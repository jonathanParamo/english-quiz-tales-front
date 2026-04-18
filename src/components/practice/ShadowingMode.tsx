import { useState, useRef, useCallback, useEffect } from 'react'
import { usePracticeStore } from '../../store/usePracticeStore'
import { useTTS } from '../../hooks/useTTS'

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-xs" style={{ color, fontSize: 11 }}>
        {icon}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest" style={{ color, fontSize: 9 }}>
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: `linear-gradient(90deg,${color}30,transparent)` }}
      />
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#34d399' : score >= 55 ? '#f59e0b' : '#f43f5e'
  const r = 22,
    circ = 2 * Math.PI * r
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="font-mono font-bold relative z-10" style={{ fontSize: 11, color }}>
        {score}
      </span>
    </div>
  )
}

function getItems(document: any): { id: string; text: string; label: string }[] {
  if (document.contentType === 'verbs') {
    return document.verbs.map((v: any) => ({
      id: v.infinitive,
      text: v.example || `${v.infinitive} — Past: ${v.pastSimple}, PP: ${v.pastParticiple}`,
      label: v.infinitive,
    }))
  }
  if (document.contentType === 'vocabulary') {
    return document.vocabulary.map((v: any) => ({
      id: v.word,
      text: v.example || `${v.word}: ${v.definition}`,
      label: v.word,
    }))
  }
  return document.paragraphs
    .flatMap((p: string, pi: number) =>
      p
        .split(/(?<=[.!?])\s+/)
        .filter((s: string) => s.trim().length > 8)
        .map((sentence: string, si: number) => ({
          id: `${pi}-${si}`,
          text: sentence.trim(),
          label: sentence.slice(0, 40) + (sentence.length > 40 ? '…' : ''),
        })),
    )
    .slice(0, 30)
}

type ShadowResult = {
  score: number
  accuracy: number
  wordsCorrect: number
  wordsTotal: number
  missedWords: string[]
  mispronounced: { expected: string; heard: string }[]
  feedback: string
  tip: string
}

type RecognitionState = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export default function ShadowingMode() {
  const { document } = usePracticeStore()
  const { speak, playing: ttsPlaying } = useTTS()

  const [items] = useState(() => (document ? getItems(document) : []))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [recState, setRecState] = useState<RecognitionState>('idle')
  const [spokenText, setSpokenText] = useState('')
  const [result, setResult] = useState<ShadowResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [speed, setSpeed] = useState(1)

  const recognitionRef = useRef<any>(null)
  const item = items[currentIdx]

  // Detectar soporte de SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) setRecState('unsupported')
  }, [])

  const handlePlay = () => {
    if (!item) return
    speak(item.text, 'female-us', { rate: speed })
  }

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setRecState('listening')

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      setSpokenText(transcript)
      setRecState('done')
      await evaluate(transcript)
    }

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error)
      setRecState(event.error === 'not-allowed' ? 'error' : 'idle')
    }

    recognition.onend = () => {
      if (recState === 'listening') setRecState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [item, speed])

  const stopListening = () => {
    recognitionRef.current?.stop()
    setRecState('idle')
  }

  const evaluate = async (spoken: string) => {
    if (!item || spoken.trim().length < 1) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/ai/evaluate-shadowing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ originalText: item.text, spokenText: spoken }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      const orig = item.text
        .toLowerCase()
        .replace(/[.,!?;:'"()-]/g, '')
        .split(/\s+/)
        .filter(Boolean)
      const said = spoken
        .toLowerCase()
        .replace(/[.,!?;:'"()-]/g, '')
        .split(/\s+/)
        .filter(Boolean)
      const correct = orig.filter((w) => said.includes(w)).length
      const accuracy = Math.round((correct / orig.length) * 100)
      setResult({
        score: accuracy,
        accuracy,
        wordsCorrect: correct,
        wordsTotal: orig.length,
        missedWords: orig.filter((w) => !said.includes(w)),
        mispronounced: [],
        feedback: `Speech recognition caught ${correct}/${orig.length} words.`,
        tip: 'Speak clearly and at a natural pace.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, items.length - 1))
    setResult(null)
    setSpokenText('')
    setRecState('idle')
  }

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(i - 1, 0))
    setResult(null)
    setSpokenText('')
    setRecState('idle')
  }

  if (!document || items.length === 0) return null

  const SPEEDS = [
    { label: '0.75×', value: 0.75 },
    { label: '1×', value: 1 },
    { label: '1.25×', value: 1.25 },
  ]

  return (
    <div className="space-y-5">
      <SectionLabel icon="◈" label="Shadowing" color="#ec4899" />

      {/* Unsupported */}
      {recState === 'unsupported' && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <p className="font-mono text-xs" style={{ color: 'rgba(244,63,94,0.7)', fontSize: 11 }}>
            ⚠ Your browser doesn't support speech recognition. Try Chrome or Edge.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
          {currentIdx + 1} / {items.length}
        </span>
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / items.length) * 100}%`, background: '#ec4899' }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div
        className="rounded-xl px-4 py-3"
        style={{
          background: 'rgba(236,72,153,0.06)',
          border: '1px solid rgba(236,72,153,0.15)',
          borderLeft: '3px solid rgba(236,72,153,0.5)',
        }}
      >
        <p
          className="font-mono text-xs uppercase tracking-widest mb-1"
          style={{ color: 'rgba(236,72,153,0.5)', fontSize: 9 }}
        >
          How to shadow
        </p>
        <p
          className="font-mono text-xs"
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.6 }}
        >
          1. Listen to the sentence &nbsp;·&nbsp; 2. Hit record &nbsp;·&nbsp; 3. Repeat exactly what
          you heard
        </p>
      </div>

      {/* Speed selector */}
      <div>
        <p
          className="font-mono text-xs uppercase tracking-widest mb-2"
          style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
        >
          Playback speed
        </p>
        <div className="flex gap-2">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpeed(s.value)}
              className="flex-1 py-1.5 rounded-lg font-mono text-xs transition-all"
              style={{
                background: speed === s.value ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${speed === s.value ? 'rgba(236,72,153,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: speed === s.value ? '#f472b6' : 'rgba(255,255,255,0.25)',
                fontSize: 10,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(236,72,153,0.1)' }}
      >
        {/* Sentence display — blurred until played */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
          >
            Sentence {currentIdx + 1}
          </p>
          <p
            className="font-body text-sm transition-all duration-500"
            style={{
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              fontSize: 15,
              // Blur the text so the user listens first
              filter: result ? 'none' : 'blur(6px)',
              userSelect: result ? 'text' : 'none',
            }}
          >
            {item?.text}
          </p>
          {!result && (
            <p
              className="font-mono text-xs mt-2"
              style={{ color: 'rgba(255,255,255,0.1)', fontSize: 9 }}
            >
              Text reveals after your attempt
            </p>
          )}
        </div>

        {/* Play + Record */}
        <div className="p-5 space-y-3">
          <button
            onClick={handlePlay}
            disabled={ttsPlaying}
            className="w-full py-3 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: ttsPlaying
                ? 'rgba(236,72,153,0.05)'
                : 'linear-gradient(135deg,#be185d,#9d174d)',
              color: 'white',
              border: '1px solid rgba(236,72,153,0.3)',
              fontSize: 11,
            }}
          >
            {ttsPlaying ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                Playing...
              </>
            ) : (
              <>
                <span style={{ fontSize: 13 }}>▶</span> Listen
              </>
            )}
          </button>

          {/* Record button */}
          {recState !== 'unsupported' && (
            <button
              onClick={recState === 'listening' ? stopListening : startListening}
              disabled={loading}
              className="w-full py-3 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background:
                  recState === 'listening'
                    ? 'rgba(244,63,94,0.12)'
                    : result
                      ? 'rgba(52,211,153,0.08)'
                      : 'rgba(236,72,153,0.08)',
                color: recState === 'listening' ? '#f43f5e' : result ? '#34d399' : '#f472b6',
                border: `1px solid ${recState === 'listening' ? 'rgba(244,63,94,0.35)' : result ? 'rgba(52,211,153,0.25)' : 'rgba(236,72,153,0.2)'}`,
                fontSize: 11,
              }}
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />{' '}
                  Analyzing...
                </>
              ) : recState === 'listening' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Recording...
                  (tap to stop)
                </>
              ) : result ? (
                <>✓ Done — tap to retry</>
              ) : (
                <>
                  <span style={{ fontSize: 13 }}>⏺</span> Record your voice
                </>
              )}
            </button>
          )}

          {/* Error state */}
          {recState === 'error' && (
            <p
              className="font-mono text-xs text-center"
              style={{ color: 'rgba(244,63,94,0.6)', fontSize: 10 }}
            >
              Microphone access denied. Please allow it in your browser settings.
            </p>
          )}

          {/* What the mic heard */}
          {spokenText && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p
                className="font-mono text-xs uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
              >
                We heard
              </p>
              <p
                className="font-mono text-xs italic"
                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              >
                "{spokenText}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(236,72,153,0.12)' }}
        >
          {/* Score */}
          <div
            className="flex items-center gap-4 p-5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ScoreRing score={result.score} />
            <div className="flex-1">
              <p
                className="font-mono text-xs uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              >
                {result.wordsCorrect} / {result.wordsTotal} words matched
              </p>
              <p
                className="font-body text-sm"
                style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}
              >
                {result.feedback}
              </p>
            </div>
          </div>

          {/* Tip */}
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(236,72,153,0.04)' }}
          >
            <p className="font-mono text-xs" style={{ color: '#f472b6', fontSize: 11 }}>
              💡 {result.tip}
            </p>
          </div>

          {/* Mispronounced + missed */}
          <div className="p-5 grid grid-cols-2 gap-3">
            {result.mispronounced.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <p
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
                >
                  Sounded like
                </p>
                {result.mispronounced.slice(0, 5).map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{
                      background: 'rgba(245,158,11,0.05)',
                      border: '1px solid rgba(245,158,11,0.12)',
                    }}
                  >
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    >
                      {m.expected}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>→</span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: 'rgba(245,158,11,0.7)', fontSize: 11 }}
                    >
                      "{m.heard}"
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.missedWords.length > 0 && (
              <div className="col-span-2">
                <p
                  className="font-mono text-xs uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
                >
                  Missed words
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missedWords.slice(0, 10).map((w) => (
                    <span
                      key={w}
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(244,63,94,0.08)',
                        color: 'rgba(244,63,94,0.6)',
                        border: '1px solid rgba(244,63,94,0.15)',
                        fontSize: 10,
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-4 py-3 rounded-xl font-mono text-xs transition-all disabled:opacity-30"
          style={{
            color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10,
          }}
        >
          ← Prev
        </button>
        <button
          onClick={handleNext}
          disabled={currentIdx === items.length - 1}
          className="flex-1 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-30"
          style={{
            background: result ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.03)',
            color: result ? '#f472b6' : 'rgba(255,255,255,0.2)',
            border: `1px solid ${result ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.07)'}`,
            fontSize: 10,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
