import { useEffect, useState, useCallback } from 'react'
import apiFetch from '../api/apiFetch'

type Level = 'beginner' | 'intermediate' | 'advanced'
type Direction = 'es→en' | 'en→es'
type InputMode = 'write' | 'select'

interface PhrasePair {
  _id: string
  spanish: string
  english: string
  level: Level
  category?: string
}

interface ClozeCard {
  pairId: string
  fullText: string // frase completa (para mostrar tras responder)
  displayText: string // frase con ___ en lugar de la palabra
  answer: string // palabra correcta
  options: string[] // opciones para modo select (incluye la correcta)
  lang: 'es' | 'en'
}

interface Props {
  level?: Level
  category?: string
  pairCount?: number
  direction?: Direction
  inputMode?: InputMode
  onFinish?: (score: number, total: number) => void
}

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

// Palabras que NO se blanquean (demasiado triviales)
const SKIP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'my',
  'your',
  'his',
  'its',
  'our',
  'their',
  'this',
  'that',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'as',
  'up',
  'but',
  'and',
  'or',
  'so',
  'do',
  'did',
  'does',
  'has',
  'have',
  'had',
  'not',
  'no',
  'yes',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'de',
  'en',
  'por',
  'para',
  'con',
  'y',
  'o',
  'que',
  'se',
])

function pickBlankWord(words: string[]): number {
  const eligible = words
    .map((w, i) => ({ w: w.replace(/[^a-záéíóúüñA-Z]/gi, ''), i }))
    .filter(({ w }) => w.length >= 4 && !SKIP_WORDS.has(w.toLowerCase()))

  if (eligible.length === 0) return Math.floor(words.length / 2)
  return eligible[Math.floor(Math.random() * eligible.length)].i
}

function buildDistractors(correct: string, pool: string[], count = 3): string[] {
  const target = correct.toLowerCase()
  const candidates = pool
    .map((w) => w.replace(/[^a-záéíóúüñA-Z]/gi, ''))
    .filter((w) => w.length >= 3 && w.toLowerCase() !== target && !SKIP_WORDS.has(w.toLowerCase()))
  const unique = [...new Set(candidates)]
  const shuffled = unique.sort(() => Math.random() - 0.5)
  const distractors = shuffled.slice(0, count)
  const fallbacks = ['maybe', 'never', 'always', 'really', 'often', 'soon', 'away', 'still']
  let fi = 0
  while (distractors.length < count && fi < fallbacks.length) {
    const fb = fallbacks[fi++]
    if (fb !== target && !distractors.includes(fb)) distractors.push(fb)
  }
  return distractors
}

function buildClozeCard(pair: PhrasePair, direction: Direction, pool: string[]): ClozeCard {
  const lang: 'es' | 'en' = direction === 'es→en' ? 'en' : 'es'
  const fullText = lang === 'en' ? pair.english : pair.spanish
  const words = fullText.split(/\s+/).filter(Boolean)
  const blankIdx = pickBlankWord(words)
  const rawWord = words[blankIdx]
  const answer = rawWord.replace(/[^a-záéíóúüñA-Z]/gi, '')

  const displayWords = [...words]
  displayWords[blankIdx] = '_'.repeat(Math.max(answer.length, 4))

  const distractors = buildDistractors(answer, pool)
  const options = [...distractors, answer].sort(() => Math.random() - 0.5)

  return {
    pairId: pair._id,
    fullText,
    displayText: displayWords.join(' '),
    answer,
    options,
    lang,
  }
}

function speakText(text: string, lang: 'es' | 'en') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'es' ? 'es-ES' : 'en-US'
  u.rate = 0.88
  window.speechSynthesis.speak(u)
}

type CardState = 'idle' | 'correct' | 'wrong' | 'revealed'

export default function ClozeGame({
  level = 'beginner',
  category,
  pairCount = 8,
  direction = 'es→en',
  inputMode = 'write',
  onFinish,
}: Props) {
  const [cards, setCards] = useState<ClozeCard[]>([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [cardState, setCardState] = useState<CardState>('idle')
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const levelColor = LEVEL_COLORS[level]

  useEffect(() => {
    const params = new URLSearchParams({ level })
    if (category) params.append('category', category)
    apiFetch<PhrasePair[]>(`phrase-pairs/random/${pairCount}?${params}`, { method: 'GET' })
      .then((data) => {
        // Pool global de palabras para distractores
        const pool = data.flatMap((p) =>
          (direction === 'es→en' ? p.english : p.spanish).split(/\s+/),
        )
        setCards(data.map((p) => buildClozeCard(p, direction, pool)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [level, category, pairCount, direction])

  const current = cards[index]

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-záéíóúüñ]/gi, '')
      .trim()

  const checkAnswer = useCallback(
    (answer: string) => {
      if (!current || cardState !== 'idle') return
      const ok = normalize(answer) === normalize(current.answer)
      setCardState(ok ? 'correct' : 'wrong')
      if (ok) setScore((s) => s + 1)
    },
    [current, cardState],
  )

  const handleWrite = useCallback(() => checkAnswer(input), [input, checkAnswer])

  const handleSelect = useCallback(
    (opt: string) => {
      if (cardState !== 'idle') return
      setSelectedOption(opt)
      checkAnswer(opt)
    },
    [cardState, checkAnswer],
  )

  const handleNext = useCallback(() => {
    if (index + 1 >= cards.length) {
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setInput('')
      setCardState('idle')
      setSelectedOption(null)
    }
  }, [index, cards.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (inputMode !== 'write') return
      if (e.key === 'Enter') {
        if (cardState === 'idle') handleWrite()
        else handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cardState, handleWrite, handleNext, inputMode])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64" style={{ background: '#080810' }}>
        <div
          className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: levelColor + '50', borderTopColor: 'transparent' }}
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
            <span style={{ fontSize: 28 }}>{score === cards.length ? '⭐' : '◎'}</span>
          </div>
          <p
            className="font-mono uppercase tracking-widest mb-1"
            style={{ fontSize: 9, color: levelColor + '70' }}
          >
            CLOZE COMPLETE
          </p>
          <h2 className="font-display font-black text-white mb-1" style={{ fontSize: 44 }}>
            {score}/{cards.length}
          </h2>
          <p className="font-mono mb-8" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            {score === cards.length ? 'Perfect! ⭐' : `${cards.length - score} mistakes`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIndex(0)
                setInput('')
                setCardState('idle')
                setScore(0)
                setFinished(false)
                setSelectedOption(null)
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
                onClick={() => onFinish(score, cards.length)}
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

  const progress = cards.length > 0 ? index / cards.length : 0

  // Renderizar la frase con el blank resaltado
  const renderPhrase = () => {
    if (cardState === 'idle') {
      // Mostrar displayText con el blank destacado
      const parts = current.displayText.split(/(_+)/)
      return (
        <p
          className="font-serif leading-relaxed m-0"
          style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }}
        >
          {parts.map((part, i) =>
            /^_+$/.test(part) ? (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  minWidth: 60,
                  borderBottom: `2px solid ${levelColor}`,
                  color: levelColor,
                  marginInline: 3,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: 14,
                  letterSpacing: 2,
                }}
              >
                {inputMode === 'write' && input ? input : '???'}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
      )
    }

    // Tras responder: mostrar frase completa con la palabra coloreada
    const words = current.fullText.split(/\s+/)
    const answerIdx = words.findIndex(
      (w) => w.replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase() === current.answer.toLowerCase(),
    )
    return (
      <p
        className="font-serif leading-relaxed m-0"
        style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }}
      >
        {words.map((w, i) => (
          <span key={i}>
            {i === answerIdx ? (
              <span
                className="font-bold"
                style={{
                  color: cardState === 'correct' ? '#34d399' : '#f43f5e',
                  textDecoration: cardState === 'wrong' ? 'underline' : 'none',
                }}
              >
                {w}
              </span>
            ) : (
              w
            )}{' '}
          </span>
        ))}
      </p>
    )
  }

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
            FILL THE GAP · {inputMode.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            {index + 1}/{cards.length}
          </span>
          <span className="font-display font-bold" style={{ fontSize: 15, color: '#34d399' }}>
            {score} ✓
          </span>
        </div>
      </div>

      {/* Progress */}
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
        {/* Context: opposite language phrase */}
        <div
          className="mb-5 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <p
            className="font-mono uppercase tracking-widest mb-1"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}
          >
            {current.lang === 'en' ? '🇪🇸 Contexto' : '🇺🇸 Context'}
          </p>
          <p
            className="font-serif m-0"
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
          >
            {current.lang === 'en'
              ? cards[index] && (cards as any)._rawPairs?.[index]?.spanish
              : cards[index] && (cards as any)._rawPairs?.[index]?.english}
          </p>
        </div>

        {/* Main phrase with blank */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13 }}>{current.lang === 'en' ? '🇺🇸' : '🇪🇸'}</span>
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
              >
                Complete the phrase
              </span>
            </div>
            <button
              onClick={() => speakText(current.fullText, current.lang)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ background: levelColor + '15', border: `1px solid ${levelColor}30` }}
            >
              <span style={{ fontSize: 10 }}>🔊</span>
            </button>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background:
                cardState === 'idle'
                  ? 'rgba(255,255,255,0.03)'
                  : cardState === 'correct'
                    ? 'rgba(52,211,153,0.06)'
                    : 'rgba(244,63,94,0.06)',
              border: `1px solid ${
                cardState === 'idle'
                  ? 'rgba(255,255,255,0.07)'
                  : cardState === 'correct'
                    ? 'rgba(52,211,153,0.25)'
                    : 'rgba(244,63,94,0.25)'
              }`,
              transition: 'all 0.3s ease',
            }}
          >
            {renderPhrase()}
          </div>
        </div>

        {/* Input area */}
        {cardState === 'idle' && (
          <div className="mb-6">
            {inputMode === 'write' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type the missing word…"
                  autoFocus
                  className="flex-1 rounded-xl px-4 py-3 font-mono text-sm transition-all"
                  style={{
                    background: 'rgba(13,13,22,0.9)',
                    border: `1px solid ${input.length > 0 ? levelColor + '40' : 'rgba(255,255,255,0.08)'}`,
                    color: 'rgba(255,255,255,0.8)',
                    outline: 'none',
                    fontSize: 14,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = levelColor + '60'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      input.length > 0 ? levelColor + '40' : 'rgba(255,255,255,0.08)'
                  }}
                />
                <button
                  onClick={handleWrite}
                  disabled={input.trim().length === 0}
                  className="px-5 py-3 rounded-xl font-mono uppercase tracking-widest transition-all disabled:opacity-30"
                  style={{
                    fontSize: 10,
                    background: `${levelColor}18`,
                    border: `1px solid ${levelColor}40`,
                    color: levelColor,
                  }}
                >
                  ✓
                </button>
              </div>
            ) : (
              /* Select mode: option buttons */
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className="py-3 px-4 rounded-xl font-serif text-sm transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.08)`,
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = levelColor + '12'
                      e.currentTarget.style.borderColor = levelColor + '40'
                      e.currentTarget.style.color = levelColor
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result feedback */}
        {cardState !== 'idle' && (
          <div className="mb-6">
            {cardState === 'wrong' && (
              <div
                className="rounded-xl px-4 py-3 mb-3"
                style={{
                  background: 'rgba(52,211,153,0.05)',
                  border: '1px solid rgba(52,211,153,0.2)',
                }}
              >
                <p
                  className="font-mono uppercase tracking-widest mb-1"
                  style={{ fontSize: 8, color: 'rgba(52,211,153,0.5)' }}
                >
                  ✓ Correct answer
                </p>
                <p className="font-serif m-0 font-bold" style={{ fontSize: 16, color: '#34d399' }}>
                  {current.answer}
                </p>
              </div>
            )}

            {/* Select mode: show which was right */}
            {inputMode === 'select' && (
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((opt) => {
                  const isCorrect = normalize(opt) === normalize(current.answer)
                  const wasSelected = opt === selectedOption
                  return (
                    <div
                      key={opt}
                      className="py-3 px-4 rounded-xl font-serif text-sm"
                      style={{
                        background: isCorrect
                          ? 'rgba(52,211,153,0.1)'
                          : wasSelected && !isCorrect
                            ? 'rgba(244,63,94,0.08)'
                            : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : wasSelected && !isCorrect ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                        color: isCorrect
                          ? '#34d399'
                          : wasSelected && !isCorrect
                            ? 'rgba(244,63,94,0.7)'
                            : 'rgba(255,255,255,0.25)',
                        fontSize: 14,
                      }}
                    >
                      {opt} {isCorrect ? '✓' : wasSelected && !isCorrect ? '✕' : ''}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Nav button */}
        {cardState !== 'idle' && (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 10,
              background:
                cardState === 'correct' ? 'rgba(52,211,153,0.12)' : 'rgba(124,92,252,0.12)',
              border: `1px solid ${cardState === 'correct' ? 'rgba(52,211,153,0.35)' : 'rgba(124,92,252,0.35)'}`,
              color: cardState === 'correct' ? '#34d399' : '#a78bfa',
            }}
          >
            {index + 1 >= cards.length ? 'Finish →' : 'Next →'} ↵
          </button>
        )}

        {/* Reveal while idle */}
        {cardState === 'idle' && (
          <button
            onClick={() => setCardState('revealed')}
            className="w-full mt-3 py-2 font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.12)',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(245,158,11,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.12)'
            }}
          >
            Show answer
          </button>
        )}
      </div>
    </div>
  )
}
