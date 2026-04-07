import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import { useUserStore } from '../store/userStore'
import ParticlesBg from '../components/effects/ParticlesBg'
import FloatingBook from '../components/effects/FloatingBook'

interface Story {
  id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  image: string | null
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

const LEVEL_CODES: Record<string, string> = {
  beginner: 'LVL·01',
  intermediate: 'LVL·02',
  advanced: 'LVL·03',
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    apiFetch<Story[]>('stories/available', { method: 'GET' })
      .then((res) => setStories(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filtered = filter === 'all' ? stories : stories.filter((s) => s.level === filter)

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#080810' }}>
      <ParticlesBg />

      {/* Gradiente radial sutil */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,92,252,0.07) 0%, transparent 60%)',
        }}
      />

      {/* ── Navbar HUD ─────────────────────────────────────── */}
      <nav
        className="relative z-40 sticky top-0 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(8,8,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,92,252,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
            />
          </div>
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
            className="font-mono text-xs ml-2 px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(124,92,252,0.1)',
              color: 'rgba(124,92,252,0.6)',
              fontSize: 9,
              border: '1px solid rgba(124,92,252,0.2)',
            }}
          >
            v2.0
          </span>
        </div>

        {/* Player info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 transition-all group"
          >
            <div
              className="relative w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm"
              style={{
                background: 'rgba(124,92,252,0.2)',
                border: '1px solid rgba(124,92,252,0.35)',
                color: '#a78bfa',
              }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'P'}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
                style={{ boxShadow: '0 0 4px #4ade80' }}
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-mono text-xs text-white/70" style={{ fontSize: 11 }}>
                {user?.username}
              </div>
              <div
                className="font-mono text-xs"
                style={{ color: 'rgba(124,92,252,0.6)', fontSize: 9 }}
              >
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </button>

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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-14 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
          style={{
            background: 'rgba(124,92,252,0.08)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}
        >
          <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: 'rgba(167,139,250,0.7)', fontSize: 10 }}
          >
            {stories.length} missions available
          </span>
        </div>

        <h1
          className="font-display font-black leading-none mb-3 select-none"
          style={{ fontSize: 'clamp(36px,7vw,64px)', letterSpacing: '-0.02em' }}
        >
          <span className="text-white">Choose your </span>
          <span
            style={{
              background: 'linear-gradient(135deg,#a78bfa 0%,#7c5cfc 40%,#34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            mission
          </span>
        </h1>
        <p
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
        >
          {'> LISTEN · READ · ANSWER · LEVEL_UP'}
        </p>
      </div>

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-6 pb-8 flex-wrap">
        {user?.role === 'god' && (
          <button
            onClick={() => navigate('/admin')}
            className="font-mono text-xs uppercase tracking-widest transition-all"
            style={{ color: '#f59e0b', fontSize: 10 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#f59e0b')}
          >
            GOD PANEL
          </button>
        )}
        {['all', 'beginner', 'intermediate', 'advanced'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
            style={{
              fontSize: 10,
              background: filter === f ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.07)'}`,
              color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.3)',
              boxShadow: filter === f ? '0 0 12px rgba(124,92,252,0.2)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (filter === f) return
              e.currentTarget.style.background = 'rgba(124,92,252,0.1)'
              e.currentTarget.style.border = '1px solid rgba(124,92,252,0.3)'
              e.currentTarget.style.color = '#a78bfa'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(124,92,252,0.15)'
            }}
            onMouseLeave={(e) => {
              if (filter === f) return
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {f === 'all' ? 'All levels' : f}
          </button>
        ))}
        <button
          onClick={() => navigate('/phrase-pairs')}
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
          style={{
            fontSize: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(124,92,252,0.2)'
            e.currentTarget.style.border = '1px solid rgba(124,92,252,0.5)'
            e.currentTarget.style.color = '#a78bfa'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(124,92,252,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Phrase Pairs
        </button>
      </div>

      {/* ── Grid de historias ────────────────────────────────── */}
      <div className="relative z-10 px-6 pb-20 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: 'rgba(124,92,252,0.5)',
                borderTopColor: 'transparent',
              }}
            />
            <span
              className="font-mono text-xs uppercase tracking-widest animate-pulse"
              style={{ color: 'rgba(124,92,252,0.5)', fontSize: 10 }}
            >
              Loading missions...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              NO MISSIONS FOUND
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((story, i) => (
              <StoryCard
                key={story.id}
                story={story}
                index={i}
                onClick={() => navigate(`/story/${story.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Línea inferior HUD */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
        style={{
          background: 'rgba(8,8,16,0.9)',
          borderTop: '1px solid rgba(124,92,252,0.08)',
        }}
      >
        <span className="font-mono text-xs" style={{ color: 'rgba(124,92,252,0.3)', fontSize: 9 }}>
          SYS::STORY_SELECT
        </span>
        <span className="font-mono text-xs" style={{ color: 'rgba(124,92,252,0.3)', fontSize: 9 }}>
          {filtered.length}/{stories.length} MISSIONS
        </span>
      </div>
    </div>
  )
}

function StoryCard({
  story,
  index,
  onClick,
}: {
  story: Story
  index: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const color = LEVEL_COLORS[story.level] ?? '#7c5cfc'
  const code = LEVEL_CODES[story.level] ?? 'LVL·??'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: hovered ? 'rgba(124,92,252,0.06)' : 'rgba(13,13,22,0.8)',
        border: `1px solid ${hovered ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(12px)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 32px rgba(124,92,252,0.15), 0 0 0 1px rgba(124,92,252,0.2)`
          : 'none',
        animation: `fadeIn 0.4s ease-out ${index * 0.07}s both`,
      }}
    >
      {/* Esquinas HUD */}
      <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-10">
        <div
          className="absolute top-2 left-2 w-3 h-px"
          style={{ background: color, opacity: 0.7 }}
        />
        <div
          className="absolute top-2 left-2 h-3 w-px"
          style={{ background: color, opacity: 0.7 }}
        />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-10">
        <div
          className="absolute top-2 right-2 w-3 h-px"
          style={{ background: color, opacity: 0.7 }}
        />
        <div
          className="absolute top-2 right-2 h-3 w-px"
          style={{ background: color, opacity: 0.7 }}
        />
      </div>

      {/* Imagen o libro 3D */}
      {story.image ? (
        <div className="h-44 overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          />
          <div
            className="absolute inset-0 h-44"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, rgba(8,8,16,0.9) 100%)',
            }}
          />
        </div>
      ) : (
        <FloatingBook color={color} onClick={onClick} />
      )}

      {/* Info */}
      <div className="p-5">
        {/* Header de la card */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{
              color,
              background: color + '15',
              border: `1px solid ${color}30`,
              fontSize: 10,
            }}
          >
            {code}
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
          >
            15 QST
          </span>
        </div>

        {/* Título */}
        <h3
          className="font-display font-bold text-white leading-tight mb-4"
          style={{ fontSize: 16 }}
        >
          {story.title}
        </h3>

        {/* Footer de la card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full" style={{ background: color }} />
            <span className="font-mono text-xs uppercase" style={{ color, fontSize: 9 }}>
              {story.level}
            </span>
          </div>
          <span
            className="font-mono text-xs transition-all"
            style={{
              color: hovered ? '#a78bfa' : 'rgba(255,255,255,0.2)',
              fontSize: 10,
            }}
          >
            {hovered ? 'ENTER →' : '· · ·'}
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: hovered ? 0.6 : 0.2,
        }}
      />
    </div>
  )
}
