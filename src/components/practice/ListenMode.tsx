import { useState } from 'react'
import { usePracticeStore } from '../../store/usePracticeStore'
import { useTTS, type TTSVoiceGender } from '../../hooks/useTTS'

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

const VOICES: { id: TTSVoiceGender; label: string; flag: string }[] = [
  { id: 'male', label: 'Male (US)', flag: '🇺🇸' },
  { id: 'female-us', label: 'Female (US)', flag: '🇺🇸' },
  { id: 'female-uk', label: 'Female (UK)', flag: '🇬🇧' },
]

const SPEEDS = [
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
]

export default function ListenMode() {
  const { document } = usePracticeStore()
  const { speak, stop, playing } = useTTS()

  const [voice, setVoice] = useState<TTSVoiceGender>('female-us')
  const [speed, setSpeed] = useState(1)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (!document) return null

  const isTable = document.contentType === 'verbs' || document.contentType === 'vocabulary'
  const items = isTable
    ? document.contentType === 'verbs'
      ? document.verbs.map((v) => ({
          id: v.infinitive,
          main: v.infinitive,
          detail: `Past simple: ${v.pastSimple}. Past participle: ${v.pastParticiple}. Example: ${v.example}`,
          preview: `${v.infinitive} → ${v.pastSimple} → ${v.pastParticiple}`,
        }))
      : document.vocabulary.map((v) => ({
          id: v.word,
          main: v.word,
          detail: `${v.definition}. Example: ${v.example}`,
          preview: `${v.word} — ${v.definition.slice(0, 50)}`,
        }))
    : document.paragraphs.map((p, i) => ({
        id: String(i),
        main: p,
        detail: p,
        preview: p.slice(0, 80) + (p.length > 80 ? '…' : ''),
      }))

  const handlePlay = (idx: number, text: string) => {
    if (playing && activeIdx === idx) {
      stop()
      setActiveIdx(null)
      return
    }
    setActiveIdx(idx)
    speak(text, voice, { rate: speed })
  }

  const handlePlayAll = () => {
    if (playing) {
      stop()
      setActiveIdx(null)
      return
    }
    const fullText = isTable
      ? items.map((it) => `${it.main}. ${it.detail}`).join('. ')
      : items.map((it) => it.main).join('. ')
    setActiveIdx(-1)
    speak(fullText, voice, { rate: speed })
  }

  return (
    <div className="space-y-5">
      <SectionLabel icon="◉" label="Listen Mode" color="#7c5cfc" />

      {/* Voice & speed controls */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(124,92,252,0.1)' }}
      >
        <div className="p-5 space-y-4">
          {/* Voice selector */}
          <div>
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
            >
              Voice
            </p>
            <div className="flex gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className="flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 font-mono text-xs"
                  style={{
                    background: voice === v.id ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${voice === v.id ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: voice === v.id ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                    fontSize: 10,
                  }}
                >
                  <span>{v.flag}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
            >
              Speed
            </p>
            <div className="flex gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className="flex-1 py-1.5 rounded-lg font-mono text-xs transition-all duration-150"
                  style={{
                    background:
                      speed === s.value ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${speed === s.value ? 'rgba(124,92,252,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    color: speed === s.value ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    fontSize: 10,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Play all */}
          <button
            onClick={handlePlayAll}
            className="w-full py-3 rounded-xl font-display font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3"
            style={{
              background:
                playing && activeIdx === -1
                  ? 'rgba(244,63,94,0.12)'
                  : 'linear-gradient(135deg,#7c5cfc,#5a3fd4)',
              border:
                playing && activeIdx === -1
                  ? '1px solid rgba(244,63,94,0.3)'
                  : '1px solid rgba(167,139,250,0.2)',
              color: 'white',
              fontSize: 12,
              boxShadow: playing && activeIdx === -1 ? 'none' : '0 0 20px rgba(124,92,252,0.2)',
            }}
          >
            {playing && activeIdx === -1 ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-mono text-xs">STOP</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14 }}>▶</span>
                <span>Play All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isActive = playing && activeIdx === idx
          return (
            <div
              key={item.id}
              className="rounded-xl flex items-center gap-3 px-4 py-3 transition-all duration-200"
              style={{
                background: isActive ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              <button
                onClick={() => handlePlay(idx, item.detail)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(124,92,252,0.3)' : 'rgba(124,92,252,0.1)',
                  border: `1px solid ${isActive ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.2)'}`,
                }}
              >
                <span className="font-mono" style={{ color: '#a78bfa', fontSize: 10 }}>
                  {isActive ? '■' : '▶'}
                </span>
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-xs font-bold truncate"
                  style={{
                    color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                    fontSize: isTable ? 13 : 11,
                  }}
                >
                  {isTable ? item.main : `¶ ${idx + 1}`}
                </p>
                <p
                  className="font-mono text-xs truncate mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                >
                  {item.preview}
                </p>
              </div>

              {/* Word-only button for table content */}
              {isTable && (
                <button
                  onClick={() => handlePlay(idx, item.main)}
                  className="font-mono text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0"
                  style={{
                    color: 'rgba(124,92,252,0.5)',
                    background: 'rgba(124,92,252,0.05)',
                    border: '1px solid rgba(124,92,252,0.15)',
                    fontSize: 9,
                  }}
                >
                  WORD
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
