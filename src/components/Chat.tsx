import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import apiFetch from '../api/apiFetch'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

interface Props {
  avgScore?: number
  userProgress?: {
    totalResults: number
    avgScore: number
    recentMistakes: string[]
    level: string
  }
  onClose?: () => void
}

// ── HoloFrame ─────────────────────────────────────────────────────────
function HoloFrame() {
  const dotsRef = useRef<THREE.Points>(null!)
  const cornersRef = useRef<THREE.LineSegments>(null!)
  const scanRef = useRef<THREE.Mesh>(null!)
  const W = 3.5,
    H = 5.4

  const { dotPositions, dotOffsets } = (() => {
    const COUNT = 90
    const pos = new Float32Array(COUNT * 3)
    const offsets = new Float32Array(COUNT)
    const perimeter = 2 * (W + H)
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT) * perimeter
      offsets[i] = i / COUNT
      let x = 0,
        y = 0
      if (t < W) {
        x = -W / 2 + t
        y = -H / 2
      } else if (t < W + H) {
        x = W / 2
        y = -H / 2 + (t - W)
      } else if (t < 2 * W + H) {
        x = W / 2 - (t - W - H)
        y = H / 2
      } else {
        x = -W / 2
        y = H / 2 - (t - 2 * W - H)
      }
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = 0.01
    }
    return { dotPositions: pos, dotOffsets: offsets }
  })()

  const cornerLines = (() => {
    const L = 0.32
    const pts = [
      [-W / 2, H / 2],
      [-W / 2 + L, H / 2],
      [-W / 2, H / 2],
      [-W / 2, H / 2 - L],
      [W / 2, H / 2],
      [W / 2 - L, H / 2],
      [W / 2, H / 2],
      [W / 2, H / 2 - L],
      [-W / 2, -H / 2],
      [-W / 2 + L, -H / 2],
      [-W / 2, -H / 2],
      [-W / 2, -H / 2 + L],
      [W / 2, -H / 2],
      [W / 2 - L, -H / 2],
      [W / 2, -H / 2],
      [W / 2, -H / 2 + L],
    ]
    const arr = new Float32Array(pts.length * 3)
    pts.forEach(([x, y], i) => {
      arr[i * 3] = x
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = 0.02
    })
    return arr
  })()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const perimeter = 2 * (W + H)
    if (dotsRef.current) {
      const pos = dotsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < 90; i++) {
        const prog = ((dotOffsets[i] + t * 0.1) % 1) * perimeter
        let x = 0,
          y = 0
        if (prog < W) {
          x = -W / 2 + prog
          y = -H / 2
        } else if (prog < W + H) {
          x = W / 2
          y = -H / 2 + (prog - W)
        } else if (prog < 2 * W + H) {
          x = W / 2 - (prog - W - H)
          y = H / 2
        } else {
          x = -W / 2
          y = H / 2 - (prog - 2 * W - H)
        }
        pos[i * 3] = x
        pos[i * 3 + 1] = y
      }
      dotsRef.current.geometry.attributes.position.needsUpdate = true
      ;(dotsRef.current.material as THREE.PointsMaterial).opacity = 0.55 + Math.sin(t * 3) * 0.35
    }
    if (scanRef.current) {
      scanRef.current.position.y = H / 2 - ((t * 0.7) % (H + 0.3))
      ;(scanRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.04 + Math.sin(t * 2) * 0.025
    }
    if (cornersRef.current) {
      ;(cornersRef.current.material as THREE.LineBasicMaterial).opacity =
        0.6 + Math.sin(t * 4) * 0.35
    }
  })

  return (
    <group>
      <mesh>
        <planeGeometry args={[W + 0.9, H + 0.9]} />
        <meshBasicMaterial
          color="#7c5cfc"
          transparent
          opacity={0.025}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={scanRef}>
        <planeGeometry args={[W - 0.08, 0.05]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#7c5cfc"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={cornersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cornerLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

// ── TTS Hook ───────────────────────────────────────────────────────────
function useTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(() => 'speechSynthesis' in window)

  // Limpia emojis y símbolos que suenan horrible en TTS
  const cleanForTTS = (text: string): string =>
    text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // emojis altos (🌍🎉 etc)
      .replace(/[\u{2600}-\u{27BF}]/gu, '') // símbolos misceláneos (☀️✨ etc)
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // variantes de presentación
      .replace(/[*_~`#>]/g, '') // markdown
      .replace(/\s+/g, ' ')
      .trim()

  const speak = useCallback(
    (text: string) => {
      if (!supported) return
      window.speechSynthesis.cancel()

      const cleanText = cleanForTTS(text)
      if (!cleanText) return

      const utter = new SpeechSynthesisUtterance(cleanText)

      // Parámetros más suaves y naturales
      utter.rate = 0.88 // más pausado, menos apresurado
      utter.pitch = 0.95 // un poco más grave, menos robótico
      utter.volume = 1

      // Priorizar voces premium/enhanced/neural que suenan mucho mejor
      const voices = window.speechSynthesis.getVoices()
      const enVoice =
        voices.find((v) => v.lang.startsWith('en') && /premium|enhanced|neural/i.test(v.name)) ||
        voices.find((v) => v.lang === 'en-US' && v.localService) ||
        voices.find((v) => v.lang.startsWith('en') && v.localService) ||
        voices.find((v) => v.lang.startsWith('en'))

      if (enVoice) utter.voice = enVoice

      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      utteranceRef.current = utter
      window.speechSynthesis.speak(utter)
    },
    [supported],
  )

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  // Cargar voces async (Chrome las carga tarde)
  useEffect(() => {
    if (!supported) return
    const load = () => window.speechSynthesis.getVoices()
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [supported])

  return { speak, stop, speaking, supported }
}

// ── Constantes ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'How can I improve faster?',
  'Why do I keep failing?',
  'What should I study next?',
  'How do natives actually talk?',
]

const now = () => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ── Componente principal ───────────────────────────────────────────────
export default function AiTutorChat({ avgScore, userProgress, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey! I'm Trista 👋 I'm not here to teach you grammar from a book — I'm here to help you sound like a real person. Ask me anything.",
      time: now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSugs, setShowSugs] = useState(true)
  const [mode, setMode] = useState<'audio' | 'text'>('audio')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { speak, stop, speaking, supported: ttsSupported } = useTTS()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── El mensaje de bienvenida NO se lee automáticamente ──
  // Solo se leen las respuestas que llegan desde la API

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setShowSugs(false)
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content, time: now() }]
    setMessages(newMessages)
    setLoading(true)
    stop()

    try {
      const res = await apiFetch<{ reply: string }>('ai/chat', {
        method: 'POST',
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          progress: userProgress,
        },
      })
      const reply = res.reply
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, time: now() }])

      // Solo leer respuestas del asistente, nunca los mensajes del usuario
      if (mode === 'audio' && ttsSupported) {
        speak(reply)
      }
    } catch {
      const errMsg = 'Oops, something went wrong. Try again!'
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg, time: now() }])
      if (mode === 'audio' && ttsSupported) speak(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    if (mode === 'audio') {
      stop()
      setMode('text')
    } else {
      setMode('audio')
    }
  }

  const handlePlayMessage = (content: string) => {
    if (speaking) {
      stop()
      return
    }
    speak(content)
  }

  return (
    <div className="relative" style={{ width: 320, height: 580 }}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <HoloFrame />
        </Canvas>
      </div>

      <div
        className="absolute inset-0.5 z-10 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(8,8,18,0.97)',
          border: '1px solid rgba(124,92,252,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Barra top */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: 'rgba(124,92,252,0.1)', background: 'rgba(124,92,252,0.04)' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
          />
          <span
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: 'rgba(167,139,250,0.5)', fontSize: 9 }}
          >
            TUTOR_AI · SESSION
          </span>

          <div className="ml-auto flex items-center gap-2">
            {ttsSupported && (
              <button
                onClick={toggleMode}
                title={mode === 'audio' ? 'Switch to text' : 'Switch to audio'}
                style={{
                  background: mode === 'audio' ? 'rgba(124,92,252,0.2)' : 'transparent',
                  border: `1px solid ${mode === 'audio' ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.2)'}`,
                  borderRadius: 6,
                  color: mode === 'audio' ? '#a78bfa' : 'rgba(167,139,250,0.4)',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px 7px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  transition: 'all 0.2s',
                }}
              >
                {mode === 'audio' ? '🔊 AUDIO' : '💬 TEXT'}
              </button>
            )}
            <div className="flex gap-1">
              {[0.3, 0.5, 0.8].map((o, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: `rgba(124,92,252,${o})` }}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(167,139,250,0.4)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 4px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(167,139,250,0.4)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Trista info */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(124,92,252,0.07)', background: 'rgba(0,0,0,0.2)' }}
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(124,92,252,0.12)',
                border: '1px solid rgba(124,92,252,0.45)',
                fontFamily: 'serif',
                fontSize: 14,
                color: '#a78bfa',
              }}
            >
              A
            </div>
            <div
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full"
              style={{ background: '#34d399', border: '2px solid #080810' }}
            />
          </div>
          <div>
            <p
              className="text-sm font-bold"
              style={{ fontFamily: 'serif', color: '#e8e0f0', letterSpacing: '.08em' }}
            >
              Trista
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 9, color: '#34d399', letterSpacing: '2px' }}
            >
              ● ONLINE · native guide
            </p>
          </div>
          {avgScore !== undefined && (
            <div className="ml-auto text-right">
              <p
                className="font-mono"
                style={{ fontSize: 8, color: 'rgba(52,211,153,0.4)', letterSpacing: '1px' }}
              >
                AVG SCORE
              </p>
              <p style={{ fontFamily: 'serif', fontSize: 14, color: '#34d399', fontWeight: 600 }}>
                {avgScore}%
              </p>
            </div>
          )}
        </div>

        {/* Banner modo audio */}
        {mode === 'audio' && ttsSupported && (
          <div
            className="flex items-center gap-2 px-4 py-1.5"
            style={{
              background: 'rgba(124,92,252,0.08)',
              borderBottom: '1px solid rgba(124,92,252,0.08)',
            }}
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 2,
                    height: h * 3 + (speaking ? Math.sin(Date.now() / 200 + i) * 4 : 0),
                    background: speaking ? '#7c5cfc' : 'rgba(124,92,252,0.3)',
                    borderRadius: 1,
                    transition: 'height 0.1s',
                  }}
                />
              ))}
            </div>
            <span
              className="font-mono"
              style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)', letterSpacing: '1.5px' }}
            >
              {speaking ? 'PLAYING AUDIO' : 'AUDIO MODE'}
            </span>
            {speaking && (
              <button
                onClick={stop}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(167,139,250,0.5)',
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '0 4px',
                }}
              >
                ■ STOP
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,92,252,0.2) transparent' }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{
                  background: m.role === 'user' ? 'rgba(52,211,153,0.1)' : 'rgba(124,92,252,0.12)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(52,211,153,0.3)' : 'rgba(124,92,252,0.35)'}`,
                  fontFamily: 'serif',
                  fontSize: 10,
                  color: m.role === 'user' ? '#34d399' : '#a78bfa',
                }}
              >
                {m.role === 'user' ? 'U' : 'A'}
              </div>
              <div className={`flex flex-col max-w-[78%] ${m.role === 'user' ? 'items-end' : ''}`}>
                <div
                  className="px-3 py-2 relative overflow-hidden"
                  style={{
                    background:
                      m.role === 'user' ? 'rgba(52,211,153,0.07)' : 'rgba(124,92,252,0.06)',
                    border: `0.5px solid ${m.role === 'user' ? 'rgba(52,211,153,0.2)' : 'rgba(124,92,252,0.2)'}`,
                    borderRadius: m.role === 'user' ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                    fontFamily: 'serif',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: m.role === 'user' ? '#a7f3d0' : '#c4b5fd',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{
                      background:
                        m.role === 'user'
                          ? 'linear-gradient(90deg,transparent,#34d399)'
                          : 'linear-gradient(90deg,#7c5cfc,transparent)',
                      opacity: 0.4,
                    }}
                  />
                  {m.content}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 8,
                      color: m.role === 'user' ? 'rgba(52,211,153,0.3)' : 'rgba(124,92,252,0.3)',
                      letterSpacing: '1px',
                    }}
                  >
                    {m.time} · {m.role === 'user' ? 'YOU' : 'TRISTA'}
                  </span>
                  {/* Botón de reproducir solo para mensajes de Trista */}
                  {m.role === 'assistant' && ttsSupported && (
                    <button
                      onClick={() => handlePlayMessage(m.content)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(124,92,252,0.4)',
                        cursor: 'pointer',
                        fontSize: 9,
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                      title="Listen"
                    >
                      {speaking ? '■' : '▶'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'rgba(124,92,252,0.12)',
                  border: '1px solid rgba(124,92,252,0.35)',
                  fontFamily: 'serif',
                  fontSize: 10,
                  color: '#a78bfa',
                }}
              >
                A
              </div>
              <div
                className="px-3 py-2.5 flex gap-1.5 items-center"
                style={{
                  background: 'rgba(124,92,252,0.06)',
                  border: '0.5px solid rgba(124,92,252,0.2)',
                  borderRadius: '2px 14px 14px 14px',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#7c5cfc', opacity: 0.6, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSugs && (
          <div className="px-3 pb-1 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="transition-all"
                style={{
                  padding: '3px 10px',
                  background: 'transparent',
                  border: '0.5px solid rgba(124,92,252,0.2)',
                  borderRadius: 20,
                  fontFamily: 'monospace',
                  fontSize: 9,
                  letterSpacing: '1px',
                  color: 'rgba(167,139,250,0.5)',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          className="flex gap-2 px-3 pb-4 pt-2 border-t"
          style={{ borderColor: 'rgba(124,92,252,0.08)' }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask Trista anything..."
            className="flex-1 text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(124,92,252,0.15)',
              borderRadius: 10,
              padding: '8px 12px',
              fontFamily: 'serif',
              fontSize: 13,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 flex items-center justify-center transition-all"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(124,92,252,0.15)',
              border: '1px solid rgba(124,92,252,0.35)',
              color: '#a78bfa',
              fontSize: 14,
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-1">
        <span className="font-mono" style={{ fontSize: 8, color: 'rgba(124,92,252,0.2)' }}>
          SYS::TUTOR_MODULE
        </span>
        <span className="font-mono" style={{ fontSize: 8, color: 'rgba(124,92,252,0.2)' }}>
          v2.1.0
        </span>
      </div>
    </div>
  )
}
