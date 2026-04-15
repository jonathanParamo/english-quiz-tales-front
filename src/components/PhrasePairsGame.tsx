import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import apiFetch from '../api/apiFetch'

// ── Tipos ──────────────────────────────────────────────────────────────
type Level = 'beginner' | 'intermediate' | 'advanced'
type CardMode = 'text' | 'listen'

interface PhrasePair {
  _id: string
  spanish: string
  english: string
  audioEs?: string
  audioEn?: string
  image?: string
  level: Level
  category?: string
}

interface GameCard {
  id: string
  pairId: string
  text: string
  lang: 'es' | 'en'
  audioUrl?: string
  imageUrl?: string
  matched: boolean
  selected: boolean
}

interface Props {
  level?: Level
  category?: string
  pairCount?: number
  onFinish?: (score: number, total: number) => void
}

interface AdminProps {
  onCreated: () => void
}

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

const NEON_PURPLE = '#b455ff'

// ── TTS helpers ────────────────────────────────────────────────────────
const TTS_LANG: Record<'es' | 'en', string> = {
  es: 'es-ES',
  en: 'en-US',
}

let currentUtterance: SpeechSynthesisUtterance | null = null

function speakText(text: string, lang: 'es' | 'en') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = TTS_LANG[lang]
  utter.rate = 0.9
  utter.pitch = 1
  currentUtterance = utter
  window.speechSynthesis.speak(utter)
}

function stopTTS() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  currentUtterance = null
}

// ── Audio ──────────────────────────────────────────────────────────────
function playAudio(url: string) {
  const audio = new Audio(url)
  audio.play().catch(() => {})
}

// ── Three.js fondo ─────────────────────────────────────────────────────
function GameParticles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null!)
  const count = 40
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
  }
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y = s.clock.elapsedTime * 0.008
    ;(ref.current.material as THREE.PointsMaterial).opacity =
      0.15 + Math.sin(s.clock.elapsedTime * 0.3) * 0.07
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ── Shuffle ────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── Icono de altavoz ───────────────────────────────────────────────────
function SpeakerIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 7H6L11 3V17L6 13H3V7Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 7C14.8 7.8 15.3 8.85 15.3 10C15.3 11.15 14.8 12.2 14 13"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16.5 5C18 6.5 19 8.15 19 10C19 11.85 18 13.5 16.5 15"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ── Icono de texto ─────────────────────────────────────────────────────
function TextIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 5H17M3 10H13M3 15H10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── CSS global ─────────────────────────────────────────────────────────
const globalStyles = `
@keyframes wavebar {
  from { transform: scaleY(0.5); }
  to   { transform: scaleY(1.6); }
}
@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 6px ${NEON_PURPLE}60, 0 0 12px ${NEON_PURPLE}30; }
  50%       { box-shadow: 0 0 10px ${NEON_PURPLE}90, 0 0 22px ${NEON_PURPLE}50; }
}
`

// ── Tarjeta individual del juego ───────────────────────────────────────
function GameCardTile({
  card,
  flash,
  accentColor,
  cardMode,
  isSpeaking,
  onClick,
  onAudioClick,
  onDragStart,
  onDrop,
  onDragOver,
}: {
  card: GameCard
  flash: boolean | null
  accentColor: string
  cardMode: CardMode
  isSpeaking: boolean
  onClick: () => void
  onAudioClick: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  // Borde: matched verde, flash ok/error, selected acento, hover NEÓN MORADO, default sutil
  const borderColor = card.matched
    ? 'rgba(52,211,153,0.35)'
    : flash === true
      ? 'rgba(52,211,153,0.6)'
      : flash === false
        ? 'rgba(244,63,94,0.6)'
        : card.selected
          ? accentColor + '60'
          : hovered
            ? `${NEON_PURPLE}cc`
            : 'rgba(255,255,255,0.07)'

  const bgColor = card.matched
    ? 'rgba(52,211,153,0.06)'
    : flash === true
      ? 'rgba(52,211,153,0.1)'
      : flash === false
        ? 'rgba(244,63,94,0.1)'
        : card.selected
          ? accentColor + '12'
          : hovered
            ? `${NEON_PURPLE}10`
            : 'rgba(13,13,22,0.8)'

  // Glow neón en hover
  const boxShadow = card.matched
    ? 'none'
    : card.selected
      ? `0 0 12px ${accentColor}30`
      : hovered
        ? `0 0 8px ${NEON_PURPLE}55, 0 0 20px ${NEON_PURPLE}25`
        : 'none'

  return (
    <div
      draggable={!card.matched}
      onClick={onClick}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden transition-all duration-200 select-none"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(12px)',
        cursor: card.matched ? 'default' : 'grab',
        opacity: card.matched ? 0.55 : 1,
        transform: card.selected
          ? 'scale(1.02)'
          : hovered && !card.matched
            ? 'translateY(-2px)'
            : 'none',
        boxShadow,
        minHeight: 56,
        transition: 'all 0.18s ease',
      }}
    >
      {/* Imagen opcional */}
      {card.imageUrl && (
        <div className="h-24 overflow-hidden">
          <img
            src={card.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          <div
            className="absolute inset-0 h-24"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,8,16,0.85))' }}
          />
        </div>
      )}

      {/* ── Layout principal: icono audio + texto, siempre juntos ── */}
      <div className="flex items-center gap-2 p-3 sm:p-4">
        {/* Botón de audio — siempre visible en ambos modos */}
        <button
          onClick={onAudioClick}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            background: isSpeaking ? accentColor : accentColor + '18',
            border: `1px solid ${accentColor}45`,
            cursor: 'pointer',
            boxShadow: isSpeaking ? `0 0 10px ${accentColor}60` : 'none',
          }}
        >
          {isSpeaking ? (
            /* Animación de ondas mientras habla */
            <span style={{ display: 'flex', gap: 2, alignItems: 'center', height: 14 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 2,
                    borderRadius: 2,
                    background: '#080810',
                    animation: `wavebar 0.7s ease-in-out ${i * 0.15}s infinite alternate`,
                    height: 6 + i * 3,
                  }}
                />
              ))}
            </span>
          ) : (
            <SpeakerIcon size={12} color={accentColor} />
          )}
        </button>

        {/* Texto de la tarjeta — siempre visible, clickeable para emparejar */}
        <p
          className="font-serif text-sm leading-relaxed m-0 flex-1"
          style={{
            color: card.matched
              ? 'rgba(52,211,153,0.6)'
              : card.selected
                ? '#e8e0f0'
                : hovered
                  ? 'rgba(255,255,255,0.92)'
                  : 'rgba(255,255,255,0.7)',
            transition: 'color 0.18s ease',
          }}
        >
          {card.text}
        </p>
      </div>

      {/* Indicador matched */}
      {card.matched && (
        <div
          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
        >
          <span style={{ fontSize: 8, color: '#34d399' }}>✓</span>
        </div>
      )}

      {/* Línea inferior decorativa */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px rounded-b-xl transition-all duration-200"
        style={{
          background: card.matched
            ? 'linear-gradient(90deg,transparent,#34d399,transparent)'
            : hovered
              ? `linear-gradient(90deg,transparent,${NEON_PURPLE},transparent)`
              : `linear-gradient(90deg,transparent,${accentColor},transparent)`,
          opacity: card.matched ? 0.4 : hovered ? 0.6 : card.selected ? 0.3 : 0.08,
        }}
      />
    </div>
  )
}

// ── Juego principal ────────────────────────────────────────────────────
export default function PhrasePairsGame({
  level = 'beginner',
  category,
  pairCount = 6,
  onFinish,
}: Props) {
  const [pairs, setPairs] = useState<PhrasePair[]>([])
  const [cards, setCards] = useState<GameCard[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [finished, setFinished] = useState(false)
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cardMode, setCardMode] = useState<CardMode>('text')
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const isMobile = () => window.matchMedia('(pointer: coarse)').matches
  const levelColor = LEVEL_COLORS[level]

  useEffect(() => {
    const params = new URLSearchParams({ level })
    if (category) params.append('category', category)

    apiFetch<PhrasePair[]>(`phrase-pairs/random/${pairCount}?${params}`, { method: 'GET' })
      .then((data) => {
        setPairs(data)
        buildCards(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [level, category, pairCount])

  // Detener TTS al cambiar de modo
  useEffect(() => {
    stopTTS()
    setSpeakingId(null)
  }, [cardMode])

  const buildCards = (data: PhrasePair[]) => {
    const esCards: GameCard[] = data.map((p) => ({
      id: `${p._id}-es`,
      pairId: p._id,
      text: p.spanish,
      lang: 'es',
      audioUrl: p.audioEs,
      imageUrl: p.image,
      matched: false,
      selected: false,
    }))
    const enCards: GameCard[] = data.map((p) => ({
      id: `${p._id}-en`,
      pairId: p._id,
      text: p.english,
      lang: 'en',
      audioUrl: p.audioEn,
      imageUrl: undefined,
      matched: false,
      selected: false,
    }))
    setCards(shuffle([...esCards, ...enCards]))
  }

  const tryMatch = useCallback((idA: string, idB: string) => {
    setCards((prev) => {
      const a = prev.find((c) => c.id === idA)
      const b = prev.find((c) => c.id === idB)
      if (!a || !b || a.matched || b.matched) return prev
      if (a.lang === b.lang) return prev

      if (a.pairId === b.pairId) {
        setScore((s) => s + 1)
        setFlash({ id: idA, ok: true })
        setTimeout(() => setFlash((f) => (f?.id === idA ? null : f)), 700)
        const next = prev.map((c) =>
          c.id === idA || c.id === idB ? { ...c, matched: true, selected: false } : c,
        )
        if (next.every((c) => c.matched)) setTimeout(() => setFinished(true), 400)
        return next
      } else {
        setErrors((e) => e + 1)
        setFlash({ id: idA, ok: false })
        setTimeout(() => setFlash((f) => (f?.id === idA ? null : f)), 600)
        return prev.map((c) => (c.id === idA || c.id === idB ? { ...c, selected: false } : c))
      }
    })
  }, [])

  // Click principal — funciona en AMBOS modos (texto y escucha)
  const handleCardClick = (card: GameCard) => {
    if (card.matched) return

    if (!selectedId) {
      setSelectedId(card.id)
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, selected: true } : c)))
      return
    }
    if (selectedId === card.id) {
      setSelectedId(null)
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, selected: false } : c)))
      return
    }
    const prev = selectedId
    setSelectedId(null)
    setCards((c) => c.map((x) => ({ ...x, selected: false })))
    tryMatch(prev, card.id)
  }

  // Click en el botón de audio — solo reproduce, NO selecciona ni empareja
  const handleAudioClick = (e: React.MouseEvent, card: GameCard) => {
    e.stopPropagation() // evita que llegue al onClick de la tarjeta

    if (speakingId === card.id) {
      stopTTS()
      setSpeakingId(null)
      return
    }

    setSpeakingId(card.id)

    if (card.audioUrl) {
      playAudio(card.audioUrl)
      setTimeout(() => setSpeakingId((id) => (id === card.id ? null : id)), 3000)
    } else {
      speakText(card.text, card.lang)
      if (window.speechSynthesis) {
        const check = () => {
          if (!window.speechSynthesis.speaking) {
            setSpeakingId((id) => (id === card.id ? null : id))
          } else {
            setTimeout(check, 200)
          }
        }
        setTimeout(check, 300)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, card: GameCard) => {
    if (card.matched || isMobile()) return
    dragId.current = card.id
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, target: GameCard) => {
    e.preventDefault()
    if (!dragId.current || target.matched || dragId.current === target.id) return
    tryMatch(dragId.current, target.id)
    dragId.current = null
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const toggleMode = () => {
    setCardMode((m) => (m === 'text' ? 'listen' : 'text'))
    setSelectedId(null)
    setCards((prev) => prev.map((c) => ({ ...c, selected: false })))
  }

  const restart = () => {
    setScore(0)
    setErrors(0)
    setFinished(false)
    setSelectedId(null)
    setSpeakingId(null)
    stopTTS()
    dragId.current = null
    buildCards(pairs)
  }

  const esCards = cards.filter((c) => c.lang === 'es')
  const enCards = cards.filter((c) => c.lang === 'en')
  const total = pairs.length

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-64 gap-4"
        style={{ background: '#080810' }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: levelColor + '50', borderTopColor: 'transparent' }}
        />
        <span
          className="font-mono uppercase tracking-widest animate-pulse"
          style={{ color: levelColor + '80', fontSize: 10 }}
        >
          Loading pairs...
        </span>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#080810' }}>
      {/* CSS global */}
      <style>{globalStyles}</style>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <GameParticles color={levelColor} />
        </Canvas>
      </div>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${levelColor}09 0%, transparent 60%)`,
        }}
      />

      {/* HUD top */}
      <div
        className="relative z-10 sticky top-0 px-4 sm:px-6 py-3 flex items-center justify-between gap-2"
        style={{
          background: 'rgba(8,8,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${levelColor}20`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-2 flex-shrink-0 rounded-full animate-pulse"
            style={{ background: levelColor, boxShadow: `0 0 8px ${levelColor}` }}
          />
          <span
            className="font-mono uppercase tracking-widest truncate"
            style={{ color: levelColor + '80', fontSize: 9 }}
          >
            PHRASE MATCH · {level.toUpperCase()}
          </span>
          {category && (
            <span
              className="font-mono px-2 py-0.5 rounded flex-shrink-0"
              style={{
                fontSize: 8,
                color: levelColor + '99',
                background: levelColor + '12',
                border: `1px solid ${levelColor}25`,
              }}
            >
              {category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* ── Toggle modo texto / escucha ── */}
          <button
            onClick={toggleMode}
            title={cardMode === 'text' ? 'Cambiar a modo escucha' : 'Cambiar a modo texto'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: cardMode === 'listen' ? levelColor + '18' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cardMode === 'listen' ? levelColor + '50' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ color: cardMode === 'listen' ? levelColor : 'rgba(255,255,255,0.3)' }}>
              {cardMode === 'listen' ? (
                <SpeakerIcon size={13} color={levelColor} />
              ) : (
                <TextIcon size={13} color="rgba(255,255,255,0.3)" />
              )}
            </span>
            <span
              className="font-mono uppercase tracking-widest hidden sm:inline"
              style={{
                fontSize: 8,
                color: cardMode === 'listen' ? levelColor : 'rgba(255,255,255,0.3)',
              }}
            >
              {cardMode === 'listen' ? 'escucha' : 'texto'}
            </span>
          </button>

          {/* Score */}
          <div className="text-center">
            <p
              className="font-mono m-0"
              style={{ fontSize: 8, color: 'rgba(52,211,153,0.4)', letterSpacing: '1px' }}
            >
              MATCH
            </p>
            <p className="font-display font-bold m-0" style={{ fontSize: 16, color: '#34d399' }}>
              {score}/{total}
            </p>
          </div>
          {errors > 0 && (
            <div className="text-center">
              <p
                className="font-mono m-0"
                style={{ fontSize: 8, color: 'rgba(244,63,94,0.4)', letterSpacing: '1px' }}
              >
                ERR
              </p>
              <p className="font-display font-bold m-0" style={{ fontSize: 16, color: '#f43f5e' }}>
                {errors}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progreso */}
      <div className="relative z-10 px-6 pt-3 pb-1">
        <div className="w-full h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${total > 0 ? (score / total) * 100 : 0}%`,
              background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})`,
            }}
          />
        </div>
      </div>

      {/* Instrucción dinámica */}
      <div className="relative z-10 text-center py-4">
        <p
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
        >
          {cardMode === 'listen'
            ? 'Escucha el audio con 🔊 y luego empareja tocando o arrastrando las tarjetas'
            : isMobile()
              ? 'Toca una frase en español y luego su traducción en inglés'
              : 'Arrastra o toca cada frase española hacia su traducción en inglés'}
        </p>
      </div>

      {/* ── Banner modo escucha ── */}
      {cardMode === 'listen' && (
        <div
          className="relative z-10 mx-4 sm:mx-6 mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3"
          style={{
            background: levelColor + '0a',
            border: `1px solid ${levelColor}25`,
          }}
        >
          <SpeakerIcon size={14} color={levelColor} />
          <p
            className="font-mono uppercase tracking-widest m-0"
            style={{ fontSize: 8, color: levelColor + '99' }}
          >
            Modo escucha — pulsa 🔊 para oír, luego toca o arrastra para emparejar
          </p>
        </div>
      )}

      {/* Tablero */}
      <div className="relative z-10 px-4 pb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 14 }}>🇪🇸</span>
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(167,139,250,0.4)' }}
              >
                Español
              </span>
            </div>
            {esCards.map((card) => (
              <GameCardTile
                key={card.id}
                card={card}
                flash={flash?.id === card.id ? flash.ok : null}
                accentColor={levelColor}
                cardMode={cardMode}
                isSpeaking={speakingId === card.id}
                onClick={() => handleCardClick(card)}
                onAudioClick={(e) => handleAudioClick(e, card)}
                onDragStart={(e) => handleDragStart(e, card)}
                onDrop={(e) => handleDrop(e, card)}
                onDragOver={handleDragOver}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 14 }}>🇺🇸</span>
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(52,211,153,0.4)' }}
              >
                English
              </span>
            </div>
            {enCards.map((card) => (
              <GameCardTile
                key={card.id}
                card={card}
                flash={flash?.id === card.id ? flash.ok : null}
                accentColor={levelColor}
                cardMode={cardMode}
                isSpeaking={speakingId === card.id}
                onClick={() => handleCardClick(card)}
                onAudioClick={(e) => handleAudioClick(e, card)}
                onDragStart={(e) => handleDragStart(e, card)}
                onDrop={(e) => handleDrop(e, card)}
                onDragOver={handleDragOver}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fin */}
      {finished && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(10,10,20,0.98)',
              border: `1px solid ${levelColor}30`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {[
              ['top-3 left-3', 'w-4 h-px'],
              ['top-3 left-3', 'w-px h-4'],
              ['top-3 right-3', 'w-4 h-px'],
              ['top-3 right-3', 'w-px h-4'],
              ['bottom-3 left-3', 'w-4 h-px'],
              ['bottom-3 left-3', 'w-px h-4'],
              ['bottom-3 right-3', 'w-4 h-px'],
              ['bottom-3 right-3', 'w-px h-4'],
            ].map(([pos, size], i) => (
              <div
                key={i}
                className={`absolute ${pos} ${size}`}
                style={{ background: levelColor, opacity: 0.4 }}
              />
            ))}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: levelColor + '15', border: `1px solid ${levelColor}40` }}
            >
              <span style={{ fontSize: 24 }}>
                {errors === 0 ? '⭐' : score === total ? '✓' : '◎'}
              </span>
            </div>
            <p
              className="font-mono uppercase tracking-widest mb-1"
              style={{ fontSize: 9, color: levelColor + '80' }}
            >
              {errors === 0 ? 'PERFECT MATCH' : 'SESSION COMPLETE'}
            </p>
            <h2 className="font-display font-black text-white mb-1" style={{ fontSize: 32 }}>
              {score}/{total}
            </h2>
            <p className="font-mono mb-2" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              {errors} error{errors !== 1 ? 's' : ''}
            </p>
            <div
              className="w-full h-1 rounded-full mb-6"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${total > 0 ? (score / total) * 100 : 0}%`,
                  background: `linear-gradient(90deg, ${levelColor}60, ${levelColor})`,
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
                style={{
                  fontSize: 10,
                  background: levelColor + '15',
                  border: `1px solid ${levelColor}40`,
                  color: levelColor,
                }}
              >
                ↺ Reintentar
              </button>
              {onFinish && (
                <button
                  onClick={() => onFinish(score, total)}
                  className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 10,
                    background: 'rgba(124,92,252,0.15)',
                    border: '1px solid rgba(124,92,252,0.4)',
                    color: '#a78bfa',
                  }}
                >
                  Continuar →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.9)', borderTop: `1px solid ${levelColor}10` }}
      >
        <span className="font-mono" style={{ color: levelColor + '30', fontSize: 9 }}>
          SYS::PHRASE_MATCH
        </span>
        <span className="font-mono" style={{ color: levelColor + '30', fontSize: 9 }}>
          {score}/{total} MATCHED
        </span>
      </div>
    </div>
  )
}

// ── Panel Admin ────────────────────────────────────────────────────────
export function AdminPhrasePairsPanel({ onCreated }: AdminProps) {
  const [spanish, setSpanish] = useState('')
  const [english, setEnglish] = useState('')
  const [level, setLevel] = useState<Level>('beginner')
  const [category, setCategory] = useState('')
  const [audioEsFile, setAudioEsFile] = useState<File | null>(null)
  const [audioEnFile, setAudioEnFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleSave = async () => {
    if (!spanish.trim() || !english.trim()) return showToast('Completa español e inglés', false)
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('spanish', spanish)
      fd.append('english', english)
      fd.append('level', level)
      if (category.trim()) fd.append('category', category)
      if (audioEsFile) fd.append('audioEs', audioEsFile)
      if (audioEnFile) fd.append('audioEn', audioEnFile)
      if (imageFile) fd.append('image', imageFile)

      await apiFetch('phrase-pairs', { method: 'POST', body: fd })

      setSpanish('')
      setEnglish('')
      setCategory('')
      setAudioEsFile(null)
      setAudioEnFile(null)
      setImageFile(null)
      setImagePreview(null)
      showToast('Par creado ✓', true)
      onCreated()
    } catch (e: any) {
      showToast(e?.message ?? 'Error al guardar', false)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(52,211,153,0.18)',
    borderRadius: 8,
    color: '#e8e0f0',
    outline: 'none',
  } as const

  const fileBtn = (
    label: string,
    file: File | null,
    accept: string,
    onChange: (f: File | null) => void,
    color = '#a78bfa',
  ) => (
    <label
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all font-mono uppercase tracking-widest w-full"
      style={{
        fontSize: 9,
        color: file ? color : 'rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.02)',
        border: `1px dashed ${file ? color + '60' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <span style={{ fontSize: 12 }}>{file ? '✓' : '⬆'}</span>
      <span className="truncate">
        {file ? file.name.slice(0, 22) + (file.name.length > 22 ? '…' : '') : label}
      </span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  )

  return (
    <div
      className="relative rounded-2xl p-6"
      style={{
        background: 'rgba(8,8,18,0.96)',
        border: '1px solid rgba(52,211,153,0.14)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: 9, color: 'rgba(52,211,153,0.45)' }}
        >
          GOD PANEL · PHRASES
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            Español
          </label>
          <input
            value={spanish}
            onChange={(e) => setSpanish(e.target.value)}
            placeholder="El gato duerme"
            className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            English
          </label>
          <input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="The cat sleeps"
            className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-2">
          {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="flex-1 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 9,
                background: level === l ? LEVEL_COLORS[l] + '15' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${level === l ? LEVEL_COLORS[l] + '50' : 'rgba(52,211,153,0.12)'}`,
                color: level === l ? LEVEL_COLORS[l] : 'rgba(255,255,255,0.2)',
              }}
            >
              {l.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            Categoría (opcional)
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="animals, food, travel..."
            className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            Imagen (opcional)
          </label>
          {imagePreview && (
            <div
              className="relative h-24 rounded-lg overflow-hidden mb-1"
              style={{ border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleImageChange(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center font-mono"
                style={{ background: 'rgba(244,63,94,0.8)', color: '#fff', fontSize: 9 }}
              >
                ✕
              </button>
            </div>
          )}
          {fileBtn('Subir imagen', imageFile, 'image/*', handleImageChange, '#34d399')}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
          >
            Audios (opcionales)
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12 }}>🇪🇸</span>
              {fileBtn('Audio español', audioEsFile, 'audio/*', setAudioEsFile, '#a78bfa')}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12 }}>🇺🇸</span>
              {fileBtn('Audio english', audioEnFile, 'audio/*', setAudioEnFile, '#34d399')}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-mono uppercase tracking-widest transition-all mt-1"
          style={{
            fontSize: 10,
            background: saving ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.4)',
            color: saving ? 'rgba(52,211,153,0.3)' : '#34d399',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '···' : '+ CREAR PAR'}
        </button>
      </div>

      {toast && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl font-mono uppercase tracking-widest whitespace-nowrap"
          style={{
            fontSize: 10,
            background: toast.ok ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.12)',
            border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.35)' : 'rgba(244,63,94,0.35)'}`,
            color: toast.ok ? '#34d399' : '#f43f5e',
            zIndex: 10,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
