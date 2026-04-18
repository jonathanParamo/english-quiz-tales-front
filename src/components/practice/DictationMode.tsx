import { useState, useRef, useCallback } from 'react'
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

// Obtiene frases del documento según el contentType
function getItems(document: any): { id: string; text: string; label: string }[] {
  if (document.contentType === 'verbs') {
    return document.verbs.map((v: any) => ({
      id: v.infinitive,
      text: v.example,
      label: v.infinitive,
    }))
  }
  if (document.contentType === 'vocabulary') {
    return document.vocabulary.map((v: any) => ({
      id: v.word,
      text: v.example,
      label: v.word,
    }))
  }
  // story / mixed — frases de los párrafos
  return document.paragraphs
    .flatMap((p: string, pi: number) =>
      p
        .split(/(?<=[.!?])\s+/)
        .filter((s: string) => s.length > 10)
        .map((sentence: string, si: number) => ({
          id: `${pi}-${si}`,
          text: sentence.trim(),
          label: sentence.slice(0, 40) + (sentence.length > 40 ? '…' : ''),
        })),
    )
    .slice(0, 30)
}

type DictationResult = {
  score: number
  accuracy: number
  wordsCorrect: number
  wordsTotal: number
  errors: { original: string; typed: string; type: 'spelling' | 'missing' | 'extra' | 'wrong' }[]
  feedback: string
  encouragement: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export default function DictationMode() {
  const { document } = usePracticeStore()
  const { speak, playing } = useTTS()

  const [items] = useState(() => (document ? getItems(document) : []))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userText, setUserText] = useState('')
  const [result, setResult] = useState<DictationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [playCount, setPlayCount] = useState(0)

  const item = items[currentIdx]

  const handlePlay = (slow = false) => {
    if (!item) return
    speak(item.text, 'female-us', { rate: slow ? 0.7 : 1 })
    setPlayCount((c) => c + 1)
  }

  const handleCheck = async () => {
    if (!item || userText.trim().length < 2) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}ai/evaluate-dictation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ originalText: item.text, userText }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      const orig = item.text
        .toLowerCase()
        .replace(/[.,!?;:'"()-]/g, '')
        .split(/\s+/)
        .filter(Boolean)
      const typed = userText
        .toLowerCase()
        .replace(/[.,!?;:'"()-]/g, '')
        .split(/\s+/)
        .filter(Boolean)
      const correct = orig.filter((w) => typed.includes(w)).length
      const accuracy = Math.round((correct / orig.length) * 100)
      setResult({
        score: accuracy,
        accuracy,
        wordsCorrect: correct,
        wordsTotal: orig.length,
        errors: [],
        feedback: `You got ${correct}/${orig.length} words right.`,
        encouragement: 'Keep practicing!',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, items.length - 1))
    setUserText('')
    setResult(null)
    setRevealed(false)
    setPlayCount(0)
  }

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(i - 1, 0))
    setUserText('')
    setResult(null)
    setRevealed(false)
    setPlayCount(0)
  }

  if (!document || items.length === 0) return null

  const errorColor = (type: string) => {
    if (type === 'missing') return '#f43f5e'
    if (type === 'extra') return '#f59e0b'
    if (type === 'spelling') return '#06b6d4'
    return '#f43f5e'
  }

  return (
    <div className="space-y-5">
      <SectionLabel icon="◎" label="Dictation" color="#06b6d4" />

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
            style={{ width: `${((currentIdx + 1) / items.length) * 100}%`, background: '#06b6d4' }}
          />
        </div>
      </div>

      {/* Audio controls */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
      >
        <p
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'rgba(6,182,212,0.5)', fontSize: 9 }}
        >
          Listen carefully and write what you hear
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => handlePlay(false)}
            disabled={playing}
            className="flex-1 py-3 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#0891b2,#0e7490)',
              color: 'white',
              border: '1px solid rgba(6,182,212,0.3)',
              fontSize: 11,
            }}
          >
            {playing ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span style={{ fontSize: 13 }}>▶</span>
            )}
            Play
          </button>

          <button
            onClick={() => handlePlay(true)}
            disabled={playing}
            className="px-4 py-3 rounded-xl font-mono text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: 'rgba(6,182,212,0.08)',
              color: 'rgba(6,182,212,0.7)',
              border: '1px solid rgba(6,182,212,0.2)',
              fontSize: 10,
            }}
          >
            🐢 Slow
          </button>
        </div>

        {playCount > 0 && (
          <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>
            Played {playCount} time{playCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Input */}
      <div>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="Type what you heard..."
          rows={4}
          disabled={!!result}
          className="w-full rounded-2xl p-4 font-body text-sm leading-relaxed resize-none transition-all"
          style={{
            background: 'rgba(13,13,22,0.88)',
            border: `1px solid ${result ? 'rgba(6,182,212,0.2)' : userText.length > 2 ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: 'rgba(255,255,255,0.7)',
            outline: 'none',
            fontSize: 14,
            opacity: result ? 0.7 : 1,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(6,182,212,0.5)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor =
              userText.length > 2 ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(255,255,255,0.1)', fontSize: 9 }}
          >
            {userText.split(/\s+/).filter(Boolean).length} words
          </span>
          {!result && (
            <button
              onClick={() => setRevealed((r) => !r)}
              className="font-mono text-xs px-2 py-0.5 rounded transition-all"
              style={{
                color: 'rgba(255,255,255,0.15)',
                fontSize: 9,
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {revealed ? 'Hide' : 'Reveal'}
            </button>
          )}
        </div>

        {/* Revealed text */}
        {revealed && !result && (
          <div
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              className="font-mono text-xs uppercase tracking-widest mb-1"
              style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
            >
              Original text
            </p>
            <p
              className="font-mono text-xs"
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.6 }}
            >
              {item?.text}
            </p>
          </div>
        )}
      </div>

      {/* Check button */}
      {!result && (
        <button
          onClick={handleCheck}
          disabled={loading || userText.trim().length < 2}
          className="w-full py-3 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            color: 'white',
            border: '1px solid rgba(6,182,212,0.3)',
            fontSize: 11,
          }}
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
              Checking...
            </>
          ) : (
            'Check ⟶'
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(6,182,212,0.12)' }}
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
                {result.wordsCorrect} / {result.wordsTotal} words correct
              </p>
              <p
                className="font-body text-sm"
                style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}
              >
                {result.feedback}
              </p>
            </div>
          </div>

          {/* Encouragement */}
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(6,182,212,0.04)' }}
          >
            <p className="font-mono text-xs" style={{ color: '#06b6d4', fontSize: 11 }}>
              ✦ {result.encouragement}
            </p>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="p-5 space-y-2">
              <p
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              >
                Errors ({result.errors.length})
              </p>
              {result.errors.slice(0, 8).map((err, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${errorColor(err.type)}20`,
                  }}
                >
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: `${errorColor(err.type)}15`,
                      color: errorColor(err.type),
                      fontSize: 8,
                      border: `1px solid ${errorColor(err.type)}25`,
                    }}
                  >
                    {err.type}
                  </span>
                  {err.original && (
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    >
                      {err.original}
                    </span>
                  )}
                  {err.typed && err.original && (
                    <span
                      className="font-mono text-xs"
                      style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                    >
                      →
                    </span>
                  )}
                  {err.typed && (
                    <span
                      className="font-mono text-xs line-through"
                      style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                    >
                      {err.typed}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Original text reveal */}
          <div className="px-5 pb-5">
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
            >
              Original
            </p>
            <p
              className="font-mono text-xs"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.6 }}
            >
              {item?.text}
            </p>
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
            background: result ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
            color: result ? '#06b6d4' : 'rgba(255,255,255,0.2)',
            border: `1px solid ${result ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.07)'}`,
            fontSize: 10,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
