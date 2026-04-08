import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { GodOnly } from '../hooks/useGodGuard'
import AdminStoriesPanel from '../components/AdminStoriesPanel'
import AdminQuestionsPanel from '../components/AdminQuestionsPanel'
import { AdminPhrasePairsPanel } from '../components/PhrasePairsGame'
import ParticlesBg from '../components/effects/ParticlesBg'
import apiFetch from '../api/apiFetch'

type Section = 'stories' | 'questions' | 'phrases'

interface Story {
  _id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

// ── Story selector ────────────────────────────────────────────────────
function StorySelector({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string, title: string) => void
}) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Story[]>('stories', { method: 'GET' })
      .then(setStories)
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stories.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="mb-5">
      <label
        className="font-mono uppercase tracking-widest block mb-2"
        style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
      >
        Seleccionar cuento
      </label>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar..."
        className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none mb-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(124,92,252,0.18)',
          color: '#e8e0f0',
          outline: 'none',
          borderRadius: 8,
        }}
      />
      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#7c5cfc' }}
          />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: 'rgba(124,92,252,0.4)' }}
          >
            Cargando...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 200 }}>
          {filtered.length === 0 && (
            <p
              className="font-mono text-center py-4"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}
            >
              SIN RESULTADOS
            </p>
          )}
          {filtered.map((s) => {
            const color = LEVEL_COLORS[s.level] ?? '#7c5cfc'
            const isActive = selected === s._id
            const isHover = hovered === s._id
            return (
              <div
                key={s._id}
                onClick={() => onSelect(s._id, s.title)}
                onMouseEnter={() => setHovered(s._id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: isActive
                    ? 'rgba(124,92,252,0.12)'
                    : isHover
                      ? 'rgba(124,92,252,0.06)'
                      : 'rgba(13,13,22,0.7)',
                  border: `1px solid ${isActive ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  transform: isHover && !isActive ? 'translateX(2px)' : 'none',
                }}
              >
                <div
                  className="absolute top-1.5 left-1.5 w-2 h-px"
                  style={{ background: color, opacity: 0.5 }}
                />
                <div
                  className="absolute top-1.5 left-1.5 w-px h-2"
                  style={{ background: color, opacity: 0.5 }}
                />
                <span className="font-display font-bold text-white" style={{ fontSize: 13 }}>
                  {s.title}
                </span>
                <span
                  className="font-mono transition-all"
                  style={{
                    fontSize: 10,
                    color: isActive
                      ? '#a78bfa'
                      : isHover
                        ? 'rgba(167,139,250,0.5)'
                        : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {isActive ? '● SEL' : isHover ? 'SELECT →' : '· · ·'}
                </span>
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-all duration-300"
                  style={{
                    background: `linear-gradient(90deg,transparent,${color},transparent)`,
                    opacity: isActive ? 0.5 : isHover ? 0.2 : 0.05,
                  }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────
function AdminContent() {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  const [section, setSection] = useState<Section>('stories')
  const [storyId, setStoryId] = useState('')
  const [storyTitle, setStoryTitle] = useState('')
  const [createdCount, setCreatedCount] = useState(0)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sections: { value: Section; label: string; sub: string; icon: string; color: string }[] = [
    { value: 'stories', label: 'Historias', sub: 'CRUD completo', icon: '📖', color: '#7c5cfc' },
    { value: 'questions', label: 'Preguntas', sub: 'Por cuento', icon: '◉', color: '#a78bfa' },
    { value: 'phrases', label: 'Phrase Matching', sub: 'ES ↔ EN', icon: '⇄', color: '#34d399' },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,92,252,0.07) 0%, transparent 60%)',
        }}
      />

      {/* Navbar */}
      <nav
        className="relative z-40 sticky top-0 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,92,252,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
          />
          <div>
            <span
              className="font-display font-black text-white tracking-tight"
              style={{ fontSize: 17 }}
            >
              ENGLISH
            </span>
            <span
              className="font-display font-black tracking-tight ml-1.5"
              style={{
                fontSize: 17,
                background: 'linear-gradient(90deg,#7c5cfc,#34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TALES
            </span>
          </div>
          <span
            className="font-mono px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(244,63,94,0.1)',
              color: 'rgba(244,63,94,0.7)',
              fontSize: 9,
              border: '1px solid rgba(244,63,94,0.2)',
            }}
          >
            GOD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="relative w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm"
              style={{
                background: 'rgba(124,92,252,0.2)',
                border: '1px solid rgba(124,92,252,0.35)',
                color: '#a78bfa',
              }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'G'}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: '#f43f5e', boxShadow: '0 0 4px #f43f5e' }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-mono text-white/70" style={{ fontSize: 11 }}>
                {user?.username}
              </div>
              <div className="font-mono" style={{ color: 'rgba(244,63,94,0.7)', fontSize: 9 }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <button
            onClick={handleLogout}
            className="font-mono text-xs uppercase tracking-widest transition-all"
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            Exit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 px-6 pt-10 pb-8">
        <div
          className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#f43f5e' }} />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ color: 'rgba(244,63,94,0.7)', fontSize: 10 }}
          >
            God Mode · Admin Panel
          </span>
        </div>
        <h1
          className="font-display font-black leading-none mb-2 select-none"
          style={{ fontSize: 'clamp(28px,5vw,48px)', letterSpacing: '-0.02em' }}
        >
          <span className="text-white">Panel de </span>
          <span
            style={{
              background: 'linear-gradient(135deg,#a78bfa 0%,#7c5cfc 40%,#34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            creación
          </span>
        </h1>
        <p
          className="font-mono uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
        >
          {'> STORIES · QUESTIONS · PHRASES · CONTENT_BUILD'}
        </p>
        {createdCount > 0 && (
          <p
            className="font-mono mt-2"
            style={{ color: 'rgba(52,211,153,0.5)', fontSize: 10, letterSpacing: '1.5px' }}
          >
            ✓ {createdCount} {createdCount === 1 ? 'elemento' : 'elementos'} en esta sesión
          </p>
        )}
      </div>

      {/* Selector de sección */}
      <div className="relative z-10 flex items-center gap-3 px-6 pb-8 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.value}
            onClick={() => setSection(s.value)}
            className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200"
            style={{
              background: section === s.value ? s.color + '12' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${section === s.value ? s.color + '40' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: section === s.value ? `0 0 16px ${s.color}20` : 'none',
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: section === s.value ? s.color : 'rgba(255,255,255,0.2)',
              }}
            >
              {s.icon}
            </span>
            <div className="text-left">
              <p
                className="font-display font-bold m-0"
                style={{
                  fontSize: 14,
                  color: section === s.value ? '#e8e0f0' : 'rgba(255,255,255,0.35)',
                }}
              >
                {s.label}
              </p>
              <p
                className="font-mono m-0"
                style={{
                  fontSize: 9,
                  color: section === s.value ? s.color + 'aa' : 'rgba(255,255,255,0.15)',
                }}
              >
                {s.sub}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* Panel izquierdo */}
          <div>
            {section === 'stories' && <AdminStoriesPanel />}

            {section === 'questions' && (
              <>
                <StorySelector
                  selected={storyId}
                  onSelect={(id, title) => {
                    setStoryId(id)
                    setStoryTitle(title)
                  }}
                />
                {storyId ? (
                  <AdminQuestionsPanel
                    storyId={storyId}
                    storyTitle={storyTitle}
                    onCreated={() => setCreatedCount((c) => c + 1)}
                  />
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{ border: '1px dashed rgba(124,92,252,0.15)' }}
                  >
                    <span style={{ fontSize: 24, color: 'rgba(124,92,252,0.2)' }}>◉</span>
                    <p
                      className="font-mono uppercase tracking-widest mt-3"
                      style={{ fontSize: 9, color: 'rgba(167,139,250,0.25)' }}
                    >
                      Choose a story to begin.
                    </p>
                  </div>
                )}
              </>
            )}

            {section === 'phrases' && (
              <AdminPhrasePairsPanel onCreated={() => setCreatedCount((c) => c + 1)} />
            )}
          </div>

          {/* Panel derecho: guía */}
          <div
            className="hidden lg:block sticky top-20 rounded-2xl p-6"
            style={{
              background: 'rgba(13,13,22,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p
              className="font-mono uppercase tracking-widest mb-5"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}
            >
              Guía · {sections.find((s) => s.value === section)?.label}
            </p>

            {section === 'stories' && (
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: '📖',
                    label: 'Crear',
                    desc: 'Título, nivel, texto, imagen y audio de narración.',
                  },
                  {
                    icon: '✎',
                    label: 'Editar',
                    desc: 'Modifica cualquier campo. Los archivos se reemplazan si subes nuevos.',
                  },
                  {
                    icon: '✕',
                    label: 'Eliminar',
                    desc: 'Doble confirmación para evitar borrados accidentales.',
                  },
                  {
                    icon: '◎',
                    label: 'Niveles',
                    desc: 'Beginner (verde) · Intermediate (ámbar) · Advanced (rojo)',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span
                      className="flex-shrink-0 mt-0.5"
                      style={{ fontSize: 14, color: 'rgba(124,92,252,0.5)' }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p
                        className="font-display font-bold m-0"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="font-serif text-xs m-0 mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === 'questions' && (
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: '◉',
                    label: 'Opción múltiple',
                    desc: '4 opciones, toca el círculo de la correcta.',
                  },
                  { icon: '⟳', label: 'Verdadero/Falso', desc: 'Afirmaciones del cuento.' },
                  {
                    icon: '＿',
                    label: 'Llenar espacio',
                    desc: 'Usa ___ en la pregunta para marcar el hueco.',
                  },
                  {
                    icon: '♪',
                    label: 'Escucha',
                    desc: 'Sube audio .mp3/.wav y escribe la respuesta.',
                  },
                  {
                    icon: '⇄',
                    label: 'Emparejar',
                    desc: '"cat|gato, dog|perro" — separa con coma.',
                  },
                  {
                    icon: '✓',
                    label: 'Oración correcta',
                    desc: 'Múltiple choice con oraciones completas.',
                  },
                  { icon: '✍', label: 'Escribir oración', desc: 'Respuesta libre del alumno.' },
                ].map((item) => (
                  <div key={item.icon} className="flex gap-3">
                    <span
                      className="font-mono flex-shrink-0 mt-0.5"
                      style={{ fontSize: 14, color: 'rgba(160, 138, 248, 0.9)' }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p
                        className="font-display font-bold m-0"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="font-serif text-xs m-0 mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === 'phrases' && (
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: '↕',
                    label: 'Individual',
                    desc: 'Crea un par con imagen y audios opcionales para ES y EN.',
                  },
                  {
                    icon: '⬆',
                    label: 'Bulk JSON',
                    desc: '[{"spanish":"...","english":"...","level":"beginner"}]',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span
                      className="font-mono flex-shrink-0 mt-0.5"
                      style={{ fontSize: 14, color: 'rgba(52,211,153,0.4)' }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p
                        className="font-display font-bold m-0"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="font-mono m-0 mt-0.5 break-all"
                        style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HUD bar inferior */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.9)', borderTop: '1px solid rgba(124,92,252,0.08)' }}
      >
        <span className="font-mono" style={{ color: 'rgba(124,92,252,0.3)', fontSize: 9 }}>
          SYS::ADMIN_PANEL
        </span>
        <span className="font-mono" style={{ color: 'rgba(124,92,252,0.3)', fontSize: 9 }}>
          {createdCount} ITEMS · SESSION
        </span>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <GodOnly>
      <AdminContent />
    </GodOnly>
  )
}
