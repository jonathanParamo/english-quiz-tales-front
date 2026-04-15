import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import ParticlesBg from '../components/effects/ParticlesBg'
import { useVideoStore, VideoItem, Difficulty, PlayerMode } from '../store/useVideoStore'
import { useUserStore } from '../store/userStore'
import { useVideoDictation, AnswerStatus } from '../hooks/useVideoDictation'
import KaraokeLine from '@/components/KaraokeLine'
import DictationResultsModal from '@/components/DictationResultModal'

type Screen = 'list' | 'config' | 'player' | 'upload'

const STATUS_COLOR: Record<string, string> = {
  ready: '#34d399',
  processing: '#f59e0b',
  pending: '#f59e0b',
  error: '#f43f5e',
}
const STATUS_LABEL: Record<string, string> = {
  ready: 'LISTO',
  processing: 'PROCESANDO',
  pending: 'EN COLA',
  error: 'ERROR',
}

// ── Helpers de color por status de respuesta ─────────────────────────────
function answerColor(status: AnswerStatus): string {
  if (status === 'correct') return '#34d399'
  if (status === 'wrong' || status === 'missed') return '#f43f5e'
  if (status === 'revealed') return '#f59e0b'
  return 'rgba(167,139,250,0.6)'
}

// ── Pantalla de configuración ────────────────────────────────────────────
function ConfigScreen({
  video,
  onStart,
  onBack,
}: {
  video: VideoItem
  onStart: () => void
  onBack: () => void
}) {
  const { difficulty, mode, setDifficulty, setMode } = useVideoStore()

  const difficulties: { value: Difficulty; label: string; desc: string; color: string }[] = [
    { value: 'easy', label: 'FÁCIL', desc: '15% palabras', color: '#34d399' },
    { value: 'medium', label: 'MEDIO', desc: '30% palabras', color: '#f59e0b' },
    { value: 'hard', label: 'DIFÍCIL', desc: '50% palabras', color: '#f43f5e' },
  ]

  const modes: { value: PlayerMode; label: string; desc: string; icon: string }[] = [
    { value: 'write', label: 'ESCRIBIR', desc: 'Escribe la palabra', icon: '✍️' },
    { value: 'select', label: 'SELECCIONAR', desc: 'Elige entre opciones', icon: '🎯' },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />

      <nav
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(167,139,250,0.1)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }}
          />
          <span
            className="font-mono uppercase tracking-widest truncate"
            style={{ fontSize: 9, color: 'rgba(167,139,250,0.6)' }}
          >
            {video.title}
          </span>
        </div>
        <button
          onClick={onBack}
          className="font-mono uppercase tracking-widest ml-4 flex-shrink-0 transition-all"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          ← Lista
        </button>
      </nav>

      <div className="relative z-10 px-6 pt-10 pb-24 max-w-lg mx-auto flex flex-col gap-6">
        <div className="text-center">
          <p
            className="font-mono uppercase tracking-widest mb-2"
            style={{ fontSize: 9, color: 'rgba(167,139,250,0.4)' }}
          >
            CONFIGURAR SESIÓN
          </p>
          <h2
            className="font-display font-black"
            style={{ fontSize: 24, color: '#e8e0f0', letterSpacing: '-0.02em' }}
          >
            {video.title}
          </h2>
        </div>

        {/* Modo */}
        <div className="flex flex-col gap-3">
          <p
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}
          >
            MODO DE PRÁCTICA
          </p>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => {
              const active = mode === m.value
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className="flex flex-col items-start gap-1 p-4 rounded-2xl transition-all"
                  style={{
                    background: active ? 'rgba(167,139,250,0.12)' : 'rgba(13,13,22,0.8)',
                    border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? '0 0 16px rgba(167,139,250,0.1)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 10, color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
                  >
                    {m.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dificultad */}
        <div className="flex flex-col gap-3">
          <p
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}
          >
            DIFICULTAD
          </p>
          <div className="grid grid-cols-3 gap-2">
            {difficulties.map((d) => {
              const active = difficulty === d.value
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                  style={{
                    background: active ? `${d.color}12` : 'rgba(13,13,22,0.8)',
                    border: `1px solid ${active ? `${d.color}50` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `0 0 12px ${d.color}20` : 'none',
                  }}
                >
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: active ? d.color : 'rgba(255,255,255,0.3)' }}
                  >
                    {d.label}
                  </span>
                  <span
                    style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}
                  >
                    {d.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botón iniciar */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl font-mono uppercase tracking-widest transition-all mt-2"
          style={{
            fontSize: 11,
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.4)',
            color: '#a78bfa',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(167,139,250,0.25)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(167,139,250,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(167,139,250,0.15)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ▶ INICIAR
        </button>
      </div>
    </div>
  )
}

// ── Pantalla de lista ────────────────────────────────────────────────────
function VideoListScreen({
  onSelect,
  onUpload,
  isGod,
}: {
  onSelect: (v: VideoItem) => void
  onUpload: () => void
  isGod: boolean
}) {
  const { videos, videosLoading, fetchVideos } = useVideoStore()
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 60%)',
        }}
      />

      <nav
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(167,139,250,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }}
          />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
          >
            VIDEO DICTATION
          </span>
        </div>
        {isGod && (
          <button
            onClick={onUpload}
            className="font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
            style={{
              fontSize: 9,
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.25)',
              color: 'rgba(52,211,153,0.7)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#34d399')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(52,211,153,0.7)')}
          >
            + SUBIR VIDEO
          </button>
        )}
      </nav>

      <div className="relative z-10 px-6 pt-10 pb-6 text-center">
        <div
          className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
          style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
          }}
        >
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10 }}
          >
            Fill in the blanks
          </span>
        </div>
        <h1
          className="font-display font-black leading-none mb-3 select-none"
          style={{ fontSize: 'clamp(30px,5vw,50px)', letterSpacing: '-0.02em' }}
        >
          <span className="text-white">Video </span>
          <span
            style={{
              background: 'linear-gradient(135deg,#a78bfa 0%,#34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Dictation
          </span>
        </h1>
        <p
          className="font-mono uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
        >
          {'> ESCUCHA · ESCRIBE · APRENDE_FAST'}
        </p>
      </div>

      <div className="relative z-10 px-6 pb-24 max-w-2xl mx-auto">
        {videosLoading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}
            />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              {isGod
                ? 'No hay videos aún. Sube el primero ↑'
                : 'No hay videos disponibles todavía.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {videos.map((v) => {
              const color = STATUS_COLOR[v.status] ?? '#a78bfa'
              const isHov = hovered === v.id
              const isReady = v.status === 'ready'
              return (
                <div
                  key={v.id}
                  onClick={() => isReady && onSelect(v)}
                  onMouseEnter={() => setHovered(v.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative p-5 rounded-2xl transition-all duration-200"
                  style={{
                    background: isHov && isReady ? 'rgba(167,139,250,0.06)' : 'rgba(13,13,22,0.8)',
                    border: `1px solid ${isHov && isReady ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: isReady ? 'pointer' : 'default',
                    backdropFilter: 'blur(12px)',
                    transform: isHov && isReady ? 'translateY(-2px)' : 'none',
                    boxShadow: isHov && isReady ? '0 0 20px rgba(167,139,250,0.1)' : 'none',
                  }}
                >
                  <div
                    className="absolute top-2 left-2 w-3 h-px"
                    style={{ background: color, opacity: 0.5 }}
                  />
                  <div
                    className="absolute top-2 left-2 w-px h-3"
                    style={{ background: color, opacity: 0.5 }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p
                        className="font-display font-bold"
                        style={{ fontSize: 15, color: '#e8e0f0' }}
                      >
                        {v.title}
                      </p>
                      <p
                        className="font-mono uppercase"
                        style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}
                      >
                        {v.language?.toUpperCase() ?? 'EN'} · DICTATION
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.status !== 'ready' && (
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: color }}
                        />
                      )}
                      <span
                        className="font-mono uppercase tracking-widest px-2 py-1 rounded-md"
                        style={{
                          fontSize: 8,
                          background: color + '12',
                          border: `1px solid ${color}30`,
                          color,
                        }}
                      >
                        {STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </div>
                  </div>
                  {isReady && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
                      style={{
                        background:
                          'linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)',
                        opacity: isHov ? 1 : 0.2,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.9)', borderTop: '1px solid rgba(167,139,250,0.08)' }}
      >
        <span className="font-mono" style={{ color: 'rgba(167,139,250,0.3)', fontSize: 9 }}>
          SYS::VIDEO_SELECT
        </span>
        <span className="font-mono" style={{ color: 'rgba(167,139,250,0.3)', fontSize: 9 }}>
          {videos.length} VIDEOS
        </span>
      </div>
    </div>
  )
}

function UploadScreen({ onBack }: { onBack: () => void }) {
  const { uploadVideo } = useVideoStore()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async () => {
    if (!file) return showToast('Selecciona un archivo de video', false)
    if (!title.trim()) return showToast('Escribe un título', false)
    if (file.size > 25 * 1024 * 1024)
      return showToast('El archivo debe pesar menos de 25 MB', false)
    setLoading(true)

    const result = await uploadVideo(file, title.trim(), lyrics.trim() || undefined)
    setLoading(false)
    if (result) {
      showToast(
        lyrics.trim()
          ? 'Video subido con letra oficial. Procesando...'
          : 'Video subido. Groq transcribiendo...',
        true,
      )
      setTimeout(() => onBack(), 1800)
    } else {
      showToast('Error al subir el video', false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />
      <nav
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.88)',
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
            GOD PANEL · UPLOAD VIDEO
          </span>
        </div>
        <button
          onClick={onBack}
          className="font-mono text-xs uppercase tracking-widest transition-all"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          ← Volver
        </button>
      </nav>

      <div className="relative z-10 px-6 pt-10 pb-24 max-w-lg mx-auto">
        <div
          className="relative rounded-2xl p-6"
          style={{
            background: 'rgba(8,8,18,0.96)',
            border: '1px solid rgba(52,211,153,0.14)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col gap-5">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
              >
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Friends S01E01 · Cold Open"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(52,211,153,0.18)',
                  color: '#e8e0f0',
                }}
              />
            </div>

            {/* Archivo de video */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
              >
                Archivo de video
              </label>
              <label
                className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl cursor-pointer transition-all"
                style={{
                  background: file ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px dashed ${file ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <span style={{ fontSize: 24 }}>{file ? '🎬' : '⬆'}</span>
                <p
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: file ? '#34d399' : 'rgba(255,255,255,0.3)' }}
                >
                  {file
                    ? file.name.slice(0, 30) + (file.name.length > 30 ? '…' : '')
                    : 'MP4 · WEBM · MOV · máx 25 MB'}
                </p>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* ✅ Letra oficial */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(52,211,153,0.5)' }}
                >
                  Letra oficial
                </label>
                <span
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}
                >
                  Opcional — mejora mucho la precisión
                </span>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder={`Pega aquí la letra de la canción o el guión...\n\nEj:\nIn the cold and dark December\nFriends are walking to the rain\n...`}
                rows={8}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${lyrics.trim() ? 'rgba(52,211,153,0.35)' : 'rgba(52,211,153,0.18)'}`,
                  color: '#e8e0f0',
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                }}
              />
              {lyrics.trim() && (
                <p
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 8, color: 'rgba(52,211,153,0.6)' }}
                >
                  ✓ {lyrics.trim().split('\n').filter(Boolean).length} líneas detectadas
                </p>
              )}
            </div>

            {/* Botón subir */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 10,
                background: loading ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.4)',
                color: loading ? 'rgba(52,211,153,0.3)' : '#34d399',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'SUBIENDO...' : `⬆ SUBIR${lyrics.trim() ? ' CON LETRA' : ' SIN LETRA'}`}
            </button>
          </div>

          {toast && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl font-mono uppercase tracking-widest whitespace-nowrap z-10"
              style={{
                fontSize: 10,
                background: toast.ok ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.12)',
                border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.35)' : 'rgba(244,63,94,0.35)'}`,
                color: toast.ok ? '#34d399' : '#f43f5e',
              }}
            >
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pantalla del player ──────────────────────────────────────────────────
function PlayerScreen({ video, onBack }: { video: VideoItem; onBack: () => void }) {
  const {
    videoRef,
    transcript,
    transcriptStatus,
    activeSegment,
    isPaused,
    isPausedForBlank, // ← nuevo
    answers,
    currentInput,
    setCurrentInput,
    submitWrite,
    submitSelect,
    togglePlay,
    rewind,
    rewindSeconds,
    mode,
    isFinished, // ← nuevo
    sessionResults, // ← nuevo
    dismissResults, // ← nuevo
  } = useVideoDictation(video.id)

  // Ventana de 3 segmentos: anterior, activo, siguiente
  const visibleSegments = [-1, 0, 1]
    .map((offset) => activeSegment + offset)
    .filter((i) => i >= 0 && i < transcript.length)

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />

      <nav
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(167,139,250,0.1)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }}
          />
          <span
            className="font-mono uppercase tracking-widest truncate"
            style={{ fontSize: 9, color: 'rgba(167,139,250,0.6)' }}
          >
            {video.title}
          </span>
        </div>
        <button
          onClick={onBack}
          className="font-mono uppercase tracking-widest ml-4 flex-shrink-0 transition-all"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          ← Lista
        </button>
      </nav>

      <div className="relative z-10 px-4 pt-4 pb-24 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Video */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: '#000', border: '1px solid rgba(167,139,250,0.12)' }}
        >
          <video
            ref={videoRef}
            className="w-full aspect-video"
            src={video.videoUrl}
            onClick={togglePlay}
            playsInline
          />
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={rewind}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 9,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
              e.currentTarget.style.color = '#a78bfa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            −{rewindSeconds}s
          </button>

          <button
            onClick={togglePlay}
            disabled={isPausedForBlank}
            className="px-6 py-2 rounded-xl font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 9,
              background: isPausedForBlank ? 'rgba(245,158,11,0.12)' : 'rgba(167,139,250,0.12)',
              border: `1px solid ${isPausedForBlank ? 'rgba(245,158,11,0.35)' : 'rgba(167,139,250,0.35)'}`,
              color: isPausedForBlank ? '#f59e0b' : '#a78bfa',
              cursor: isPausedForBlank ? 'not-allowed' : 'pointer',
              opacity: isPausedForBlank ? 0.7 : 1,
            }}
          >
            {isPausedForBlank ? '⏳ RESPONDE' : isPaused ? '▶ PLAY' : '⏸ PAUSA'}
          </button>

          {/* Badge modo activo */}
          <div
            className="px-3 py-1.5 rounded-lg font-mono uppercase tracking-widest"
            style={{
              fontSize: 8,
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.2)',
              color: 'rgba(167,139,250,0.6)',
            }}
          >
            {mode === 'write' ? '✍️ WRITE' : '🎯 SELECT'}
          </div>
        </div>

        {/* Área karaoke */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4 min-h-[160px]"
          style={{
            background: 'rgba(13,13,22,0.85)',
            border: '1px solid rgba(167,139,250,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {transcriptStatus === 'processing' || transcriptStatus === 'loading' ? (
            <div className="flex items-center gap-3 py-4">
              <div
                className="w-4 h-4 rounded-full border border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}
              />
              <p
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(167,139,250,0.4)' }}
              >
                {transcriptStatus === 'loading'
                  ? 'CARGANDO TRANSCRIPT...'
                  : 'WHISPER PROCESANDO...'}
              </p>
            </div>
          ) : transcriptStatus === 'error' ? (
            <p
              className="font-mono uppercase tracking-widest py-4"
              style={{ fontSize: 9, color: 'rgba(244,63,94,0.5)' }}
            >
              ERR::TRANSCRIPT_FAILED
            </p>
          ) : transcript.length > 0 ? (
            <div className="flex flex-col gap-3">
              {visibleSegments.length === 0 ? (
                <p
                  className="font-mono uppercase tracking-widest py-2 text-center"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}
                >
                  REPRODUCE EL VIDEO PARA VER LOS SUBTÍTULOS
                </p>
              ) : (
                visibleSegments.map((segIdx) => {
                  const seg = transcript[segIdx]
                  const isActive = segIdx === activeSegment
                  return (
                    <div key={segIdx}>
                      {/* Separador visual entre segmentos */}
                      {segIdx !== visibleSegments[0] && (
                        <div
                          className="h-px mb-3"
                          style={{ background: 'rgba(167,139,250,0.06)' }}
                        />
                      )}
                      <KaraokeLine
                        text={seg.text}
                        blanks={seg.blanks}
                        segIdx={segIdx}
                        isActive={isActive}
                        answers={answers}
                        currentInput={currentInput}
                        setCurrentInput={setCurrentInput}
                        onSubmitWrite={submitWrite}
                        onSubmitSelect={submitSelect}
                        mode={mode}
                      />
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <p
              className="font-mono uppercase tracking-widest py-4 text-center"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}
            >
              REPRODUCE EL VIDEO PARA VER LOS SUBTÍTULOS
            </p>
          )}
        </div>

        {/* Barra de progreso */}
        {transcript.length > 0 && (
          <div className="flex gap-0.5">
            {transcript.map((seg, i) => {
              const hasBlank = seg.blanks.length > 0
              const ans = answers[i]?.[0]
              const bg =
                i === activeSegment
                  ? '#a78bfa'
                  : ans?.status === 'correct'
                    ? '#34d399'
                    : ans?.status === 'wrong' || ans?.status === 'missed'
                      ? '#f43f5e'
                      : i < activeSegment
                        ? 'rgba(167,139,250,0.3)'
                        : hasBlank
                          ? 'rgba(167,139,250,0.15)'
                          : 'rgba(255,255,255,0.07)'
              return (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ minWidth: 3, background: bg }}
                />
              )
            })}
          </div>
        )}
      </div>

      {isFinished && sessionResults && (
        <DictationResultsModal
          isOpen={isFinished}
          results={sessionResults}
          onClose={() => {
            dismissResults()
            onBack()
          }}
          onReplay={() => {
            dismissResults()
            if (videoRef.current) {
              videoRef.current.currentTime = 0
              videoRef.current.play().catch(() => {})
            }
          }}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.9)', borderTop: '1px solid rgba(167,139,250,0.08)' }}
      >
        <span className="font-mono" style={{ color: 'rgba(167,139,250,0.3)', fontSize: 9 }}>
          SYS::KARAOKE_PLAYER
        </span>
        <span className="font-mono" style={{ color: 'rgba(167,139,250,0.3)', fontSize: 9 }}>
          {transcript.length > 0
            ? `${Math.min(activeSegment + 1, transcript.length)}/${transcript.length} SEG`
            : '···'}
        </span>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────
export default function VideosDictationPage() {
  const { user } = useUserStore()
  const isGod = user?.role === 'god'
  const { setActiveVideo } = useVideoStore()

  const [screen, setScreen] = useState<Screen>('list')
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  if (screen === 'upload' && !isGod) {
    setScreen('list')
    return null
  }

  if (screen === 'player' && selectedVideo) {
    return <PlayerScreen video={selectedVideo} onBack={() => setScreen('list')} />
  }

  if (screen === 'config' && selectedVideo) {
    return (
      <ConfigScreen
        video={selectedVideo}
        onBack={() => setScreen('list')}
        onStart={() => {
          setActiveVideo(selectedVideo)
          setScreen('player')
        }}
      />
    )
  }

  if (screen === 'upload') {
    return <UploadScreen onBack={() => setScreen('list')} />
  }

  return (
    <VideoListScreen
      isGod={isGod}
      onSelect={(v) => {
        setSelectedVideo(v)
        setScreen('config') // ← va a config primero, no directo al player
      }}
      onUpload={() => setScreen('upload')}
    />
  )
}
