import { useEffect, useRef } from 'react'
import { PlayerMode } from '../store/useVideoStore'
import { AnswerStatus, AnswerMap } from '../hooks/useVideoDictation'

interface Blank {
  wordIndex: number
  displayText: string
  options?: string[]
}

interface KaraokeLineProps {
  text: string
  blanks: Blank[]
  segIdx: number
  isActive: boolean
  answers: AnswerMap
  currentInput: string
  setCurrentInput: (v: string) => void
  onSubmitWrite: (segIdx: number, blankIdx: number, input: string) => void
  onSubmitSelect: (segIdx: number, blankIdx: number, option: string) => void
  mode: PlayerMode
}

function answerColor(status: AnswerStatus): string {
  if (status === 'correct') return '#34d399'
  if (status === 'wrong' || status === 'missed') return '#f43f5e'
  if (status === 'revealed') return '#f59e0b'
  return 'rgba(167,139,250,0.6)'
}

function splitByBlank(displayText: string) {
  const parts = displayText.split(/(_+)/)
  return parts.filter((p) => p.length > 0).map((p) => ({ text: p, isBlank: /^_+$/.test(p) }))
}

export default function KaraokeLine({
  text,
  blanks,
  segIdx,
  isActive,
  answers,
  currentInput,
  setCurrentInput,
  onSubmitWrite,
  onSubmitSelect,
  mode,
}: KaraokeLineProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isActive && mode === 'write' && blanks.length > 0) {
      const firstPending = blanks.findIndex(
        (_, i) => !answers[segIdx]?.[i] || answers[segIdx][i].status === 'pending',
      )
      if (firstPending === 0) {
        inputRef.current?.focus()
      }
    }
  }, [isActive, mode, blanks, answers, segIdx])

  if (blanks.length === 0) {
    return (
      <p
        className="leading-relaxed font-sans"
        style={{
          fontSize: isActive ? 16 : 13,
          color: isActive ? '#e8e0f0' : 'rgba(255,255,255,0.28)',
          transition: 'all 0.2s',
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    )
  }

  return (
    <div
      className="flex flex-col gap-2"
      style={{ opacity: isActive ? 1 : 0.45, transition: 'opacity 0.2s' }}
    >
      {blanks.map((blank, bIdx) => {
        const answer = answers[segIdx]?.[bIdx]
        const status: AnswerStatus = answer?.status ?? 'pending'
        const parts = splitByBlank(blank.displayText)

        const blankNode = (() => {
          const underscores = parts.find((p) => p.isBlank)?.text ?? '____'
          const minWidth = Math.max(underscores.length * 9, 60)

          if (status === 'correct') {
            return (
              <span
                style={{
                  color: '#34d399',
                  fontWeight: 700,
                  borderBottom: '2px solid #34d399',
                  paddingBottom: 1,
                }}
              >
                {answer!.input}
              </span>
            )
          }

          if (status === 'wrong' || status === 'missed') {
            return (
              <span className="inline-flex items-baseline gap-1">
                {answer?.input && (
                  <span
                    style={{
                      color: '#f43f5e',
                      textDecoration: 'line-through',
                      opacity: 0.7,
                    }}
                  >
                    {answer.input}
                  </span>
                )}
                {answer?.correctWord && (
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{answer.correctWord}</span>
                )}
              </span>
            )
          }

          if (isActive && mode === 'write') {
            return (
              <input
                ref={bIdx === 0 ? inputRef : undefined}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSubmitWrite(segIdx, bIdx, currentInput)
                  }
                }}
                placeholder={underscores}
                className="bg-transparent outline-none border-b-2 font-sans inline-block"
                style={{
                  fontSize: 16,
                  color: '#e8e0f0',
                  borderColor: 'rgba(167,139,250,0.6)',
                  width: minWidth,
                  minWidth: 50,
                  verticalAlign: 'baseline',
                }}
              />
            )
          }

          return (
            <span
              style={{
                color: isActive ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.2)',
                borderBottom: `1px solid ${isActive ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.15)'}`,
                minWidth,
                display: 'inline-block',
                paddingBottom: 1,
              }}
            >
              {isActive ? '·'.repeat(Math.max(underscores.length, 4)) : underscores}
            </span>
          )
        })()

        return (
          <div key={bIdx} className="flex flex-col gap-2">
            {/* Línea con blank inline */}
            <p
              className="font-sans leading-relaxed"
              style={{
                fontSize: isActive ? 16 : 13,
                color: isActive ? '#d4cce8' : 'rgba(255,255,255,0.28)',
                lineHeight: 1.7,
              }}
            >
              {parts.map((part, i) =>
                part.isBlank ? <span key={i}>{blankNode}</span> : <span key={i}>{part.text}</span>,
              )}
            </p>

            {/* Botones de opciones — solo en active + select + pending */}
            {isActive && mode === 'select' && status === 'pending' && blank.options && (
              <div className="flex flex-wrap gap-2">
                {blank.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onSubmitSelect(segIdx, bIdx, opt)}
                    className="px-3 py-1.5 rounded-lg font-mono uppercase tracking-widest transition-all"
                    style={{
                      fontSize: 10,
                      background: 'rgba(167,139,250,0.08)',
                      border: '1px solid rgba(167,139,250,0.25)',
                      color: 'rgba(167,139,250,0.8)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(167,139,250,0.2)'
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'
                      e.currentTarget.style.color = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(167,139,250,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'
                      e.currentTarget.style.color = 'rgba(167,139,250,0.8)'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
