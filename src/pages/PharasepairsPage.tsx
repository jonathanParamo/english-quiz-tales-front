import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ParticlesBg from '../components/effects/ParticlesBg'
import apiFetch from '../api/apiFetch'
import PhrasePairsGame from '@/components/PhrasePairsGame'
import TranslationGame from '@/components/TranslationGame'
import ClozeGame from '@/components/ClozeGame'

type Level = 'beginner' | 'intermediate' | 'advanced'
type GameMode = 'match' | 'translate' | 'cloze-write' | 'cloze-select'
type Direction = 'es→en' | 'en→es'
type Screen = 'select' | 'game' | 'finish'

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

const LEVELS: { value: Level; label: string; sub: string; code: string }[] = [
  { value: 'beginner', label: 'Beginner', sub: 'Frases cotidianas', code: 'LVL·01' },
  { value: 'intermediate', label: 'Intermediate', sub: 'Contextos variados', code: 'LVL·02' },
  { value: 'advanced', label: 'Advanced', sub: 'Expresiones complejas', code: 'LVL·03' },
]

const PAIR_COUNTS = [4, 6, 8, 10]

interface GameModeOption {
  value: GameMode
  label: string
  sub: string
  icon: string
  color: string
}

const GAME_MODES: GameModeOption[] = [
  {
    value: 'match',
    label: 'Match',
    sub: 'Empareja ES ↔ EN',
    icon: '⟷',
    color: '#a78bfa',
  },
  {
    value: 'translate',
    label: 'Translate',
    sub: 'Escribe la traducción completa',
    icon: '✎',
    color: '#34d399',
  },
  {
    value: 'cloze-write',
    label: 'Fill · Write',
    sub: 'Escribe la palabra que falta',
    icon: '___',
    color: '#f59e0b',
  },
  {
    value: 'cloze-select',
    label: 'Fill · Select',
    sub: 'Selecciona la palabra correcta',
    icon: '◎',
    color: '#f43f5e',
  },
]

export default function PhrasePairsPage() {
  const navigate = useNavigate()

  const [screen, setScreen] = useState<Screen>('select')
  const [selectedLevel, setLevel] = useState<Level>('beginner')
  const [selectedCat, setCat] = useState<string>('')
  const [pairCount, setPairCount] = useState(6)
  const [gameMode, setGameMode] = useState<GameMode>('match')
  const [direction, setDirection] = useState<Direction>('es→en')
  const [categories, setCategories] = useState<string[]>([])
  const [lastScore, setLastScore] = useState({ score: 0, total: 0 })
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<string[]>(`phrase-pairs/categories?level=${selectedLevel}`, { method: 'GET' })
      .then((data) => {
        setCategories(data)
        setCat('')
      })
      .catch(() => setCategories([]))
  }, [selectedLevel])

  const handleFinish = (score: number, total: number) => {
    setLastScore({ score, total })
    setScreen('finish')
  }

  // ── Game screen ──────────────────────────────────────────────────────
  if (screen === 'game') {
    if (gameMode === 'match') {
      return (
        <PhrasePairsGame
          level={selectedLevel}
          category={selectedCat || undefined}
          pairCount={pairCount}
          onFinish={handleFinish}
        />
      )
    }
    if (gameMode === 'translate') {
      return (
        <TranslationGame
          level={selectedLevel}
          category={selectedCat || undefined}
          pairCount={pairCount}
          direction={direction}
          onFinish={handleFinish}
        />
      )
    }
    if (gameMode === 'cloze-write') {
      return (
        <ClozeGame
          level={selectedLevel}
          category={selectedCat || undefined}
          pairCount={pairCount}
          direction={direction}
          inputMode="write"
          onFinish={handleFinish}
        />
      )
    }
    if (gameMode === 'cloze-select') {
      return (
        <ClozeGame
          level={selectedLevel}
          category={selectedCat || undefined}
          pairCount={pairCount}
          direction={direction}
          inputMode="select"
          onFinish={handleFinish}
        />
      )
    }
  }

  // ── Finish screen ────────────────────────────────────────────────────
  if (screen === 'finish') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: '#080810' }}
      >
        <ParticlesBg />
        <div className="relative z-10 w-full max-w-sm text-center">
          <p
            className="font-mono uppercase tracking-widest mb-2"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            RESULTADO
          </p>
          <h2 className="font-display font-black text-white mb-1" style={{ fontSize: 48 }}>
            {lastScore.score}/{lastScore.total}
          </h2>
          <p className="font-mono mb-8" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {lastScore.score === lastScore.total ? '¡Perfecto!' : 'Buen intento, sigue practicando'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('game')}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest"
              style={{
                fontSize: 10,
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.35)',
                color: '#34d399',
              }}
            >
              ↺ Otra vez
            </button>
            <button
              onClick={() => setScreen('select')}
              className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest"
              style={{
                fontSize: 10,
                background: 'rgba(124,92,252,0.12)',
                border: '1px solid rgba(124,92,252,0.35)',
                color: '#a78bfa',
              }}
            >
              ← Menú
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Select screen ────────────────────────────────────────────────────
  const levelColor = LEVEL_COLORS[selectedLevel]

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(52,211,153,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Navbar */}
      <nav
        className="relative z-40 sticky top-0 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(52,211,153,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }}
          />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            PHRASE MATCH
          </span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="font-mono text-xs uppercase tracking-widest transition-all"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          ← Back
        </button>
      </nav>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ color: 'rgba(52,211,153,0.7)', fontSize: 10 }}
          >
            Practice phrases
          </span>
        </div>
        <h1
          className="font-display font-black leading-none mb-3 select-none"
          style={{ fontSize: 'clamp(32px,6vw,56px)', letterSpacing: '-0.02em' }}
        >
          <span className="text-white">Phrase </span>
          <span
            style={{
              background: 'linear-gradient(135deg,#34d399 0%,#a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Practice
          </span>
        </h1>
        <p
          className="font-mono uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
        >
          {'> CONNECT · ES ↔ EN · LEARN_FAST'}
        </p>
      </div>

      <div className="relative z-10 px-6 pb-24 max-w-2xl mx-auto">
        {/* ── Game mode selector ── */}
        <div className="mb-8">
          <p
            className="font-mono uppercase tracking-widest mb-3"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}
          >
            Modo de juego
          </p>
          <div className="grid grid-cols-2 gap-3">
            {GAME_MODES.map((m) => {
              const isActive = gameMode === m.value
              return (
                <div
                  key={m.value}
                  onClick={() => setGameMode(m.value)}
                  className="relative p-4 rounded-2xl cursor-pointer transition-all duration-200"
                  style={{
                    background: isActive ? m.color + '10' : 'rgba(13,13,22,0.8)',
                    border: `1px solid ${isActive ? m.color + '45' : 'rgba(255,255,255,0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: isActive ? `0 0 20px ${m.color}12` : 'none',
                  }}
                >
                  {/* Corner HUD */}
                  <div
                    className="absolute top-2 left-2 w-3 h-px"
                    style={{ background: m.color, opacity: isActive ? 0.7 : 0.25 }}
                  />
                  <div
                    className="absolute top-2 left-2 w-px h-3"
                    style={{ background: m.color, opacity: isActive ? 0.7 : 0.25 }}
                  />

                  <span
                    className="font-mono block mb-2 text-lg"
                    style={{ color: isActive ? m.color : m.color + '50' }}
                  >
                    {m.icon}
                  </span>
                  <p className="font-display font-bold text-white m-0" style={{ fontSize: 14 }}>
                    {m.label}
                  </p>
                  <p
                    className="font-mono m-0 mt-1"
                    style={{
                      fontSize: 8,
                      color: isActive ? m.color + 'aa' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {m.sub}
                  </p>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
                    style={{
                      background: `linear-gradient(90deg,transparent,${m.color},transparent)`,
                      opacity: isActive ? 0.5 : 0.08,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Direction (solo para translate y cloze) ── */}
        {gameMode !== 'match' && (
          <div className="mb-8">
            <p
              className="font-mono uppercase tracking-widest mb-3"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}
            >
              Dirección
            </p>
            <div className="flex gap-3">
              {(['es→en', 'en→es'] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className="flex-1 py-2.5 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 10,
                    background: direction === d ? levelColor + '15' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${direction === d ? levelColor + '45' : 'rgba(255,255,255,0.07)'}`,
                    color: direction === d ? levelColor : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {d === 'es→en' ? '🇪🇸 → 🇺🇸' : '🇺🇸 → 🇪🇸'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Level selector ── */}
        <div className="mb-8">
          <p
            className="font-mono uppercase tracking-widest mb-3"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}
          >
            Nivel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LEVELS.map((l) => {
              const color = LEVEL_COLORS[l.value]
              const isActive = selectedLevel === l.value
              const isHover = hovered === l.value
              return (
                <div
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  onMouseEnter={() => setHovered(l.value)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative p-5 rounded-2xl cursor-pointer transition-all duration-200"
                  style={{
                    background: isActive
                      ? color + '10'
                      : isHover
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(13,13,22,0.8)',
                    border: `1px solid ${isActive ? color + '45' : 'rgba(255,255,255,0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    transform: isHover && !isActive ? 'translateY(-2px)' : 'none',
                    boxShadow: isActive ? `0 0 20px ${color}15` : 'none',
                  }}
                >
                  <div
                    className="absolute top-2 left-2 w-3 h-px"
                    style={{ background: color, opacity: isActive ? 0.7 : 0.3 }}
                  />
                  <div
                    className="absolute top-2 left-2 w-px h-3"
                    style={{ background: color, opacity: isActive ? 0.7 : 0.3 }}
                  />
                  <span
                    className="font-mono block mb-2"
                    style={{ fontSize: 9, color: isActive ? color : color + '60' }}
                  >
                    {l.code}
                  </span>
                  <p className="font-display font-bold text-white m-0" style={{ fontSize: 16 }}>
                    {l.label}
                  </p>
                  <p
                    className="font-mono m-0 mt-1"
                    style={{
                      fontSize: 9,
                      color: isActive ? color + 'aa' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {l.sub}
                  </p>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
                    style={{
                      background: `linear-gradient(90deg,transparent,${color},transparent)`,
                      opacity: isActive ? 0.5 : 0.1,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Category ── */}
        {categories.length > 0 && (
          <div className="mb-8">
            <p
              className="font-mono uppercase tracking-widest mb-3"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}
            >
              Categoría (opcional)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCat('')}
                className="px-4 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
                style={{
                  fontSize: 9,
                  background:
                    selectedCat === '' ? 'rgba(124,92,252,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCat === '' ? 'rgba(124,92,252,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  color: selectedCat === '' ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                }}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCat(cat)}
                  className="px-4 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 9,
                    background: selectedCat === cat ? levelColor + '18' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedCat === cat ? levelColor + '45' : 'rgba(255,255,255,0.07)'}`,
                    color: selectedCat === cat ? levelColor : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Pair count ── */}
        <div className="mb-10">
          <p
            className="font-mono uppercase tracking-widest mb-3"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}
          >
            Número de pares
          </p>
          <div className="flex gap-3">
            {PAIR_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setPairCount(n)}
                className="w-14 h-14 rounded-xl font-display font-bold transition-all"
                style={{
                  fontSize: 18,
                  background: pairCount === n ? 'rgba(124,92,252,0.18)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${pairCount === n ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.1)'}`,
                  color: pairCount === n ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ── Start button ── */}
        <button
          onClick={() => setScreen('game')}
          className="w-full py-4 rounded-2xl font-mono uppercase tracking-widest transition-all"
          style={{
            fontSize: 12,
            background: levelColor + '18',
            border: `1px solid ${levelColor}45`,
            color: levelColor,
            boxShadow: `0 0 20px ${levelColor}15`,
          }}
        >
          ▶ Start · {GAME_MODES.find((m) => m.value === gameMode)?.label} · {pairCount} pares
        </button>
      </div>

      {/* HUD bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.9)', borderTop: '1px solid rgba(52,211,153,0.08)' }}
      >
        <span className="font-mono" style={{ color: 'rgba(52,211,153,0.3)', fontSize: 9 }}>
          SYS::PHRASE_SELECT
        </span>
        <span className="font-mono" style={{ color: 'rgba(52,211,153,0.3)', fontSize: 9 }}>
          {gameMode.toUpperCase()} · {selectedLevel.toUpperCase()} · {pairCount} PAIRS
        </span>
      </div>
    </div>
  )
}
