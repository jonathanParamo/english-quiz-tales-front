import { useEffect, useState, useCallback } from 'react'
import apiFetch from '../api/apiFetch'

type Level = 'beginner' | 'intermediate' | 'advanced'
type Direction = 'es→en' | 'en→es'

interface PhrasePair {
  _id: string
  spanish: string
  english: string
  level: Level
  category?: string
}

interface Props {
  level?: Level
  category?: string
  pairCount?: number
  direction?: Direction
  onFinish?: (score: number, total: number) => void
}

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

// Normaliza para comparación: minúsculas, sin puntuación extra, trim
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[¿¡.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Similitud: acepta si coincide ≥ 80% de palabras clave
function isSimilarEnough(userAnswer: string, correct: string): boolean {
  if (normalize(userAnswer) === normalize(correct)) return true
  const aWords = normalize(userAnswer).split(' ').filter(Boolean)
  const bWords = normalize(correct).split(' ').filter(Boolean)
  if (bWords.length === 0) return false
  const matches = bWords.filter((w) => aWords.includes(w)).length
  return matches / bWords.length >= 0.8
}

function speakText(text: string, lang: 'es' | 'en') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang === 'es' ? 'es-ES' : 'en-US'
  utter.rate = 0.88
  window.speechSynthesis.speak(utter)
}

type CardState = 'idle' | 'correct' | 'wrong' | 'revealed'

export default function TranslationGame({
  level = 'beginner',
  category,
  pairCount = 6,
  direction = 'es→en',
  onFinish,
}: Props) {
  const [pairs, setPairs] = useState<PhrasePair[]>([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [cardState, setCardState] = useState<CardState>('idle')
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const levelColor = LEVEL_COLORS[level]

  useEffect(() => {
    const params = new URLSearchParams({ level })
    if (category) params.append('category', category)
    apiFetch<PhrasePair[]>(`phrase-pairs/random/${pairCount}?${params}`, { method: 'GET' })
      .then((data) => setPairs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [level, category, pairCount])

  const current = pairs[index]
  const sourceText = current ? (direction === 'es→en' ? current.spanish : current.english) : ''
  const targetText = current ? (direction === 'es→en' ? current.english : current.spanish) : ''
  const sourceLang: 'es' | 'en' = direction === 'es→en' ? 'es' : 'en'
  const targetLang: 'es' | 'en' = direction === 'es→en' ? 'en' : 'es'

  const handleCheck = useCallback(() => {
    if (!current || cardState !== 'idle') return
    const ok = isSimilarEnough(input, targetText)
    setCardState(ok ? 'correct' : 'wrong')
    if (ok) setScore((s) => s + 1)
  }, [current, cardState, input, targetText])

  const handleReveal = () => setCardState('revealed')

  const handleNext = useCallback(() => {
    if (index + 1 >= pairs.length) {
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setInput('')
      setCardState('idle')
      setShowHint(false)
    }
  }, [index, pairs.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (cardState === 'idle') handleCheck()
        else handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cardState, handleCheck, handleNext])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64" style={{ background: '#080810' }}>
        <div
          className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: LEVEL_COLORS[level] + '50', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (finished) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#080810' }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: levelColor + '12', border: `1px solid ${levelColor}35` }}
          >
            <span style={{ fontSize: 28 }}>{score === pairs.length ? '⭐' : '◎'}</span>
          </div>
          <p
            className="font-mono uppercase tracking-widest mb-1"
            style={{ fontSize: 9, color: levelColor + '70' }}
          >
            TRANSLATION COMPLETE
          </p>
          <h2 className="font-display font-black text-white mb-1" style={{ fontSize: 44 }}>
            {score}/{pairs.length}
          </h2>
          <p className="font-mono mb-8" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            {score === pairs.length ? 'Perfect! ⭐' : `${pairs.length - score} to review`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIndex(0)
                setInput('')
                setCardState('idle')
                setScore(0)
                setFinished(false)
                setShowHint(false)
              }}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest"
              style={{
                fontSize: 10,
                background: levelColor + '12',
                border: `1px solid ${levelColor}35`,
                color: levelColor,
              }}
            >
              ↺ Again
            </button>
            {onFinish && (
              <button
                onClick={() => onFinish(score, pairs.length)}
                className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest"
                style={{
                  fontSize: 10,
                  background: 'rgba(124,92,252,0.12)',
                  border: '1px solid rgba(124,92,252,0.35)',
                  color: '#a78bfa',
                }}
              >
                ← Menu
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!current) return null

  const progress = pairs.length > 0 ? index / pairs.length : 0
  const hint = targetText.slice(0, Math.ceil(targetText.length * 0.3)) + '…'

  return (
    <div className="min-h-screen" style={{ background: '#080810' }}>
      {/* HUD */}
      <div
        className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${levelColor}18`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: levelColor }}
          />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: levelColor + '70' }}
          >
            TRANSLATE · {direction.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            {index + 1}/{pairs.length}
          </span>
          <span className="font-display font-bold" style={{ fontSize: 15, color: '#34d399' }}>
            {score} ✓
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg,${levelColor}60,${levelColor})`,
          }}
        />
      </div>

      <div className="max-w-lg mx-auto px-5 pt-10 pb-24">
        {/* Phrase to translate */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 13 }}>{sourceLang === 'es' ? '🇪🇸' : '🇺🇸'}</span>
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
            >
              {sourceLang === 'es'
                ? 'Español → traduce al inglés'
                : 'English → translate to Spanish'}
            </span>
          </div>

          <div
            className="relative rounded-2xl p-5 cursor-pointer group"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${levelColor}20` }}
            onClick={() => speakText(sourceText, sourceLang)}
          >
            <p className="font-serif leading-relaxed text-white m-0" style={{ fontSize: 20 }}>
              {sourceText}
            </p>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span style={{ fontSize: 14, color: levelColor + '80' }}>🔊</span>
            </div>
          </div>
        </div>

        {/* Answer area */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 13 }}>{targetLang === 'en' ? '🇺🇸' : '🇪🇸'}</span>
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
            >
              Your translation
            </span>
          </div>

          {cardState === 'idle' ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your translation here…"
              rows={3}
              autoFocus
              className="w-full rounded-xl p-4 font-serif text-sm leading-relaxed resize-none transition-all"
              style={{
                background: 'rgba(13,13,22,0.9)',
                border: `1px solid ${input.length > 2 ? levelColor + '30' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.8)',
                outline: 'none',
                fontSize: 15,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = levelColor + '50'
              }}
              onBlur={(e) => {
                e.target.style.borderColor =
                  input.length > 2 ? levelColor + '30' : 'rgba(255,255,255,0.08)'
              }}
            />
          ) : (
            <div className="space-y-3">
              {/* User answer */}
              <div
                className="rounded-xl p-4"
                style={{
                  background:
                    cardState === 'correct'
                      ? 'rgba(52,211,153,0.06)'
                      : cardState === 'wrong'
                        ? 'rgba(244,63,94,0.06)'
                        : 'rgba(245,158,11,0.06)',
                  border: `1px solid ${
                    cardState === 'correct'
                      ? 'rgba(52,211,153,0.25)'
                      : cardState === 'wrong'
                        ? 'rgba(244,63,94,0.25)'
                        : 'rgba(245,158,11,0.25)'
                  }`,
                }}
              >
                <p
                  className="font-mono uppercase tracking-widest mb-1.5"
                  style={{
                    fontSize: 8,
                    color:
                      cardState === 'correct'
                        ? 'rgba(52,211,153,0.5)'
                        : cardState === 'wrong'
                          ? 'rgba(244,63,94,0.5)'
                          : 'rgba(245,158,11,0.5)',
                  }}
                >
                  {cardState === 'correct'
                    ? '✓ Correct'
                    : cardState === 'wrong'
                      ? '✕ Your answer'
                      : '◎ Revealed'}
                </p>
                <p
                  className="font-serif m-0"
                  style={{
                    fontSize: 15,
                    color:
                      cardState === 'correct'
                        ? '#34d399'
                        : cardState === 'wrong'
                          ? 'rgba(244,63,94,0.8)'
                          : 'rgba(245,158,11,0.7)',
                    textDecoration: cardState === 'wrong' ? 'line-through' : 'none',
                  }}
                >
                  {input || '—'}
                </p>
              </div>

              {/* Correct answer if wrong or revealed */}
              {(cardState === 'wrong' || cardState === 'revealed') && (
                <div
                  className="rounded-xl p-4 cursor-pointer group"
                  style={{
                    background: 'rgba(52,211,153,0.05)',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}
                  onClick={() => speakText(targetText, targetLang)}
                >
                  <p
                    className="font-mono uppercase tracking-widest mb-1.5"
                    style={{ fontSize: 8, color: 'rgba(52,211,153,0.5)' }}
                  >
                    ✓ Correct answer{' '}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">🔊</span>
                  </p>
                  <p className="font-serif m-0" style={{ fontSize: 15, color: '#34d399' }}>
                    {targetText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hint */}
        {cardState === 'idle' && (
          <div className="mb-6">
            {showHint ? (
              <p className="font-mono" style={{ fontSize: 10, color: 'rgba(245,158,11,0.6)' }}>
                💡 {hint}
              </p>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="font-mono uppercase tracking-widest transition-all"
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  background: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(245,158,11,0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.15)'
                }}
              >
                💡 Show hint
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {cardState === 'idle' ? (
            <>
              <button
                onClick={handleCheck}
                disabled={input.trim().length < 2}
                className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all disabled:opacity-30"
                style={{
                  fontSize: 10,
                  background: `linear-gradient(135deg,${levelColor}20,${levelColor}10)`,
                  border: `1px solid ${levelColor}40`,
                  color: levelColor,
                }}
              >
                Check ↵
              </button>
              <button
                onClick={handleReveal}
                className="px-5 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(245,158,11,0.6)'
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                Reveal
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 10,
                background:
                  cardState === 'correct' ? 'rgba(52,211,153,0.12)' : 'rgba(124,92,252,0.12)',
                border: `1px solid ${cardState === 'correct' ? 'rgba(52,211,153,0.35)' : 'rgba(124,92,252,0.35)'}`,
                color: cardState === 'correct' ? '#34d399' : '#a78bfa',
              }}
            >
              {index + 1 >= pairs.length ? 'Finish →' : 'Next →'} ↵
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
