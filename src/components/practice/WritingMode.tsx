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
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f43f5e'
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

export default function WritingMode() {
  const { document, writingText, writingFeedback, writingLoading, setWritingText, reviewWriting } =
    usePracticeStore()
  const { speak } = useTTS()

  if (!document) return null

  const targetWords =
    document.contentType === 'verbs'
      ? document.verbs.map((v) => v.infinitive)
      : document.vocabulary.map((v) => v.word)

  return (
    <div className="space-y-5">
      <SectionLabel icon="◆" label="Writing Practice" color="#f59e0b" />

      {/* Prompt */}
      <div
        className="rounded-xl px-4 py-3"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderLeft: '3px solid rgba(245,158,11,0.5)',
        }}
      >
        <p
          className="font-mono text-xs uppercase tracking-widest mb-2"
          style={{ color: 'rgba(245,158,11,0.5)', fontSize: 9 }}
        >
          Mission objective
        </p>
        <p
          className="font-mono text-xs"
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}
        >
          Write sentences using as many words from this document as you can. The AI will evaluate
          grammar, vocabulary usage, and sentence flow.
        </p>
      </div>

      {/* Target words preview */}
      {targetWords.length > 0 && (
        <div>
          <p
            className="font-mono text-xs uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
          >
            Target words ({targetWords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {targetWords.slice(0, 20).map((w) => {
              const used = writingFeedback?.usedWords.includes(w)
              const missed = writingFeedback?.missedWords.includes(w)
              return (
                <button
                  key={w}
                  onClick={() => speak(w, 'female-us')}
                  className="font-mono text-xs px-2 py-0.5 rounded transition-all duration-200"
                  style={{
                    fontSize: 10,
                    background: used
                      ? 'rgba(52,211,153,0.12)'
                      : missed
                        ? 'rgba(244,63,94,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${used ? 'rgba(52,211,153,0.3)' : missed ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    color: used
                      ? '#34d399'
                      : missed
                        ? 'rgba(244,63,94,0.6)'
                        : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {w}
                </button>
              )
            })}
            {targetWords.length > 20 && (
              <span
                className="font-mono text-xs px-2 py-0.5"
                style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
              >
                +{targetWords.length - 20} more
              </span>
            )}
          </div>
          {writingFeedback && (
            <p
              className="font-mono text-xs mt-2"
              style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
            >
              <span style={{ color: '#34d399' }}>■</span> used &nbsp;
              <span style={{ color: 'rgba(244,63,94,0.6)' }}>■</span> missed &nbsp;
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>■</span> not checked yet
            </p>
          )}
        </div>
      )}

      {/* Textarea */}
      <div>
        <textarea
          value={writingText}
          onChange={(e) => setWritingText(e.target.value)}
          placeholder="Write your sentences here..."
          rows={5}
          className="w-full rounded-2xl p-4 font-body text-sm leading-relaxed resize-none transition-all"
          style={{
            background: 'rgba(13,13,22,0.88)',
            border: `1px solid ${writingText.length > 10 ? 'rgba(124,92,252,0.25)' : 'rgba(255,255,255,0.07)'}`,
            color: 'rgba(255,255,255,0.7)',
            outline: 'none',
            fontSize: 14,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(124,92,252,0.4)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor =
              writingText.length > 10 ? 'rgba(124,92,252,0.25)' : 'rgba(255,255,255,0.07)'
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(255,255,255,0.1)', fontSize: 9 }}
          >
            {writingText.length} chars
          </span>
          {writingText.length > 0 && (
            <button
              onClick={() => speak(writingText, 'female-us')}
              className="font-mono text-xs px-2 py-0.5 rounded transition-all"
              style={{
                color: 'rgba(124,92,252,0.5)',
                fontSize: 9,
                border: '1px solid rgba(124,92,252,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#a78bfa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(124,92,252,0.5)'
              }}
            >
              ▶ Hear my text
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={reviewWriting}
          disabled={writingLoading || writingText.trim().length < 10}
          className="flex-1 py-3 rounded-xl font-display font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#7c5cfc,#5a3fd4)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: 'white',
            fontSize: 11,
            boxShadow: '0 0 20px rgba(124,92,252,0.2)',
          }}
        >
          {writingLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="font-mono text-xs">Analyzing...</span>
            </>
          ) : (
            <>Review with AI ⟶</>
          )}
        </button>
        <button
          onClick={() => setWritingText('')}
          className="px-4 py-3 rounded-xl font-mono text-xs transition-all"
          style={{
            color: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f43f5e'
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          }}
        >
          Clear
        </button>
      </div>

      {/* Feedback */}
      {writingFeedback && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(124,92,252,0.1)' }}
        >
          {/* Score header */}
          <div
            className="flex items-center gap-4 p-5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ScoreRing score={writingFeedback.score} />
            <div>
              <p
                className="font-mono text-xs uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              >
                Writing Score
              </p>
              <p
                className="font-body text-sm"
                style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}
              >
                {writingFeedback.summary}
              </p>
            </div>
          </div>

          {/* Encouragement */}
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(52,211,153,0.04)' }}
          >
            <p className="font-mono text-xs" style={{ color: '#34d399', fontSize: 11 }}>
              ✦ {writingFeedback.encouragement}
            </p>
          </div>

          {/* Corrections */}
          {writingFeedback.corrections.length > 0 && (
            <div className="p-5 space-y-3">
              <p
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              >
                Corrections ({writingFeedback.corrections.length})
              </p>
              {writingFeedback.corrections.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    background: 'rgba(244,63,94,0.05)',
                    border: '1px solid rgba(244,63,94,0.1)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="font-mono text-xs flex-shrink-0"
                      style={{ color: 'rgba(244,63,94,0.5)', fontSize: 9, marginTop: 1 }}
                    >
                      ✕
                    </span>
                    <p
                      className="font-mono text-xs line-through"
                      style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                    >
                      {c.original}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className="font-mono text-xs flex-shrink-0"
                      style={{ color: '#34d399', fontSize: 9, marginTop: 1 }}
                    >
                      ✓
                    </span>
                    <p
                      className="font-mono text-xs font-bold"
                      style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    >
                      {c.suggestion}
                    </p>
                  </div>
                  <p
                    className="font-mono text-xs"
                    style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, paddingLeft: 14 }}
                  >
                    {c.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Word stats */}
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(52,211,153,0.05)',
                border: '1px solid rgba(52,211,153,0.1)',
              }}
            >
              <p
                className="font-mono text-xs uppercase tracking-widest mb-1"
                style={{ color: 'rgba(52,211,153,0.4)', fontSize: 8 }}
              >
                Words used ✓
              </p>
              <p className="font-mono text-xs font-bold" style={{ color: '#34d399', fontSize: 11 }}>
                {writingFeedback.usedWords.join(', ') || '—'}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(244,63,94,0.05)',
                border: '1px solid rgba(244,63,94,0.1)',
              }}
            >
              <p
                className="font-mono text-xs uppercase tracking-widest mb-1"
                style={{ color: 'rgba(244,63,94,0.4)', fontSize: 8 }}
              >
                Words missed ✕
              </p>
              <p
                className="font-mono text-xs font-bold"
                style={{ color: 'rgba(244,63,94,0.6)', fontSize: 11 }}
              >
                {writingFeedback.missedWords.slice(0, 6).join(', ') || '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
