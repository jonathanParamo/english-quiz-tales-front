import { SessionResults } from '../hooks/useVideoDictation'

interface DictationResultsModalProps {
  isOpen: boolean
  results: SessionResults
  onClose: () => void
  onReplay: () => void
}

export default function DictationResultsModal({
  isOpen,
  results,
  onClose,
  onReplay,
}: DictationResultsModalProps) {
  if (!isOpen) return null

  const { correct, wrong, missed, total } = results
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const circumference = 2 * Math.PI * 42

  const grade =
    pct >= 90
      ? { label: 'PERFECT', color: '#34d399', glow: 'rgba(52,211,153,0.3)' }
      : pct >= 70
        ? { label: 'GREAT', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' }
        : pct >= 50
          ? { label: 'GOOD', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' }
          : { label: 'KEEP GOING', color: '#f43f5e', glow: 'rgba(244,63,94,0.3)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0d18 0%, #080810 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: `0 0 60px ${grade.glow}, 0 0 120px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Top accent line */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${grade.color}, transparent)` }}
        />

        <div className="px-7 pt-8 pb-7 flex flex-col gap-6">
          {/* Header */}
          <div className="text-center flex flex-col gap-1">
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: 'rgba(167,139,250,0.4)' }}
            >
              SESSION COMPLETE
            </span>
            <h2
              className="font-mono uppercase tracking-widest"
              style={{
                fontSize: 22,
                color: grade.color,
                letterSpacing: '0.2em',
                textShadow: `0 0 20px ${grade.glow}`,
              }}
            >
              {grade.label}
            </h2>
          </div>

          {/* Score ring */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28">
              <svg
                className="w-full h-full"
                style={{ transform: 'rotate(-90deg)' }}
                viewBox="0 0 100 100"
              >
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="6"
                />
                {/* Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={grade.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: `drop-shadow(0 0 6px ${grade.color})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 28, color: '#e8e0f0', lineHeight: 1 }}
                >
                  {pct}%
                </span>
                <span
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}
                >
                  SCORE
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard value={correct} label="CORRECT" color="#34d399" />
            <StatCard value={wrong} label="WRONG" color="#f43f5e" />
            <StatCard value={missed} label="MISSED" color="#f59e0b" />
          </div>

          {/* Total */}
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(167,139,250,0.05)',
              border: '1px solid rgba(167,139,250,0.12)',
            }}
          >
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}
            >
              TOTAL BLANKS
            </span>
            <span className="font-mono" style={{ fontSize: 16, color: '#e8e0f0', fontWeight: 700 }}>
              {total}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
                e.currentTarget.style.color = '#a78bfa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
              }}
            >
              ← Lista
            </button>
            <button
              onClick={onReplay}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 10,
                background: `${grade.color}15`,
                border: `1px solid ${grade.color}50`,
                color: grade.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${grade.color}25`
                e.currentTarget.style.boxShadow = `0 0 16px ${grade.glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${grade.color}15`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              ↺ REPLAY
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}25`,
      }}
    >
      <span className="font-mono font-bold" style={{ fontSize: 22, color, lineHeight: 1 }}>
        {value}
      </span>
      <span
        className="font-mono uppercase tracking-widest"
        style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}
      >
        {label}
      </span>
    </div>
  )
}
