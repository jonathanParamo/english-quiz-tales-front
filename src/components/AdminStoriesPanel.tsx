import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import apiFetch from '../api/apiFetch'

// ── Tipos ──────────────────────────────────────────────────────────────
type Level = 'beginner' | 'intermediate' | 'advanced'

interface Story {
  _id: string
  title: string
  level: Level
  image: string | null
  text?: string
  createdAt?: string
}

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#34d399',
  intermediate: '#f59e0b',
  advanced: '#f43f5e',
}

const LEVEL_CODES: Record<Level, string> = {
  beginner: 'LVL·01',
  intermediate: 'LVL·02',
  advanced: 'LVL·03',
}

// ── Three.js fondo ─────────────────────────────────────────────────────
function StoryParticles() {
  const ref = useRef<THREE.Points>(null!)
  const count = 50
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
  }
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y = s.clock.elapsedTime * 0.01
    ;(ref.current.material as THREE.PointsMaterial).opacity =
      0.18 + Math.sin(s.clock.elapsedTime * 0.4) * 0.07
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#7c5cfc"
        transparent
        opacity={0.2}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ── Form vacío ─────────────────────────────────────────────────────────
const emptyForm = (): Omit<Story, '_id' | 'createdAt'> => ({
  title: '',
  level: 'beginner',
  image: null,
  text: '',
})

// ── Sub: tarjeta de historia ───────────────────────────────────────────
function StoryCard({
  story,
  onEdit,
  onDelete,
}: {
  story: Story
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const color = LEVEL_COLORS[story.level]
  const code = LEVEL_CODES[story.level]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setConfirmDel(false)
      }}
      className="relative rounded-xl overflow-hidden transition-all duration-200 cursor-default"
      style={{
        background: hovered ? 'rgba(124,92,252,0.06)' : 'rgba(13,13,22,0.8)',
        border: `1px solid ${hovered ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(12px)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* HUD corners */}
      <div className="absolute top-2 left-2 w-3 h-px" style={{ background: color, opacity: 0.6 }} />
      <div className="absolute top-2 left-2 w-px h-3" style={{ background: color, opacity: 0.6 }} />
      <div
        className="absolute top-2 right-2 w-3 h-px"
        style={{ background: color, opacity: 0.6 }}
      />
      <div
        className="absolute top-2 right-2 w-px h-3"
        style={{ background: color, opacity: 0.6 }}
      />

      {/* Imagen */}
      {story.image && (
        <div className="h-28 overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          <div
            className="absolute inset-0 h-28"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(8,8,16,0.9))' }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-mono px-2 py-0.5 rounded"
            style={{ fontSize: 9, color, background: color + '15', border: `1px solid ${color}30` }}
          >
            {code}
          </span>
          {story.createdAt && (
            <span className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
              {new Date(story.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <h3
          className="font-display font-bold text-white mb-3 leading-tight"
          style={{ fontSize: 14 }}
        >
          {story.title}
        </h3>

        {story.text && (
          <p
            className="font-serif text-xs mb-3 line-clamp-2"
            style={{ color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}
          >
            {story.text.slice(0, 80)}
            {story.text.length > 80 ? '…' : ''}
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 rounded-lg font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 9,
              background: 'rgba(124,92,252,0.1)',
              border: '1px solid rgba(124,92,252,0.25)',
              color: '#a78bfa',
            }}
          >
            ✎ Editar
          </button>

          {confirmDel ? (
            <button
              onClick={onDelete}
              className="flex-1 py-1.5 rounded-lg font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 9,
                background: 'rgba(244,63,94,0.15)',
                border: '1px solid rgba(244,63,94,0.4)',
                color: '#f43f5e',
              }}
            >
              ¿Seguro? ✕
            </button>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="py-1.5 px-3 rounded-lg font-mono uppercase tracking-widest transition-all"
              style={{
                fontSize: 9,
                background: 'rgba(244,63,94,0.05)',
                border: '1px solid rgba(244,63,94,0.15)',
                color: 'rgba(244,63,94,0.5)',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Línea inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-all duration-300"
        style={{
          background: `linear-gradient(90deg,transparent,${color},transparent)`,
          opacity: hovered ? 0.5 : 0.15,
        }}
      />
    </div>
  )
}

export default function AdminStoriesPanel() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState<Level | 'all'>('all')

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Cargar stories ───────────────────────────────────────────────
  const loadStories = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Story[]>('stories', { method: 'GET' })
      setStories(data)
    } catch {
      showToast('Error al cargar historias', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  // ── Abrir form edición ───────────────────────────────────────────
  const openEdit = (story: Story) => {
    setForm({ title: story.title, level: story.level, image: story.image, text: story.text ?? '' })
    setEditId(story._id)
    setImageFile(null)
    setShowForm(true)
  }

  const openCreate = () => {
    setForm(emptyForm())
    setEditId(null)
    setImageFile(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
  }

  // ── Guardar (crear o editar) ─────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) return showToast('El título es obligatorio', false)

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('level', form.level)
      if (form.text) fd.append('text', form.text)
      if (imageFile) fd.append('image', imageFile)

      // 🔥 AUDIO
      if (audioFile) fd.append('audio', audioFile)

      if (editId) {
        await apiFetch(`stories/${editId}`, { method: 'PATCH', body: fd })
        showToast('Historia actualizada ✓', true)
      } else {
        await apiFetch('stories/create', { method: 'POST', body: fd })
        showToast('Historia creada ✓', true)
      }

      await loadStories()
      closeForm()
    } catch (e: any) {
      showToast(e?.message ?? 'Error al guardar', false)
    } finally {
      setSaving(false)
    }
  }
  // ── Eliminar ─────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`stories/${id}`, { method: 'DELETE' })
      setStories((s) => s.filter((x) => x._id !== id))
      showToast('Historia eliminada', true)
    } catch {
      showToast('Error al eliminar', false)
    }
  }

  // ── Filtrado ─────────────────────────────────────────────────────
  const filtered = stories.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    const matchLevel = filterLevel === 'all' || s.level === filterLevel
    return matchSearch && matchLevel
  })

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(124,92,252,0.18)',
    borderRadius: 8,
    color: '#e8e0f0',
    outline: 'none',
  } as const

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Canvas fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <StoryParticles />
        </Canvas>
      </div>

      <div
        className="relative z-10 p-6"
        style={{
          background: 'rgba(8,8,18,0.96)',
          border: '1px solid rgba(124,92,252,0.14)',
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
              />
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: 9, color: 'rgba(167,139,250,0.45)' }}
              >
                GOD PANEL · STORIES
              </span>
            </div>
            <h2 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
              {stories.length} historias
            </h2>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono uppercase tracking-widest transition-all"
            style={{
              fontSize: 9,
              background: 'rgba(124,92,252,0.15)',
              border: '1px solid rgba(124,92,252,0.4)',
              color: '#a78bfa',
            }}
          >
            + Nueva
          </button>
        </div>

        {/* Buscador + filtro nivel */}
        <div className="flex gap-2 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar historia..."
            className="flex-1 px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
          <div className="flex gap-1">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className="px-3 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
                style={{
                  fontSize: 8,
                  background:
                    filterLevel === l ? 'rgba(124,92,252,0.18)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${filterLevel === l ? 'rgba(124,92,252,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  color:
                    filterLevel === l
                      ? '#a78bfa'
                      : l === 'all'
                        ? 'rgba(255,255,255,0.3)'
                        : LEVEL_COLORS[l as Level] + '99',
                }}
              >
                {l === 'all' ? 'ALL' : l.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lista de stories ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ fontSize: 24, color: 'rgba(124,92,252,0.2)' }}>◎</span>
            <p
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: 'rgba(167,139,250,0.2)' }}
            >
              {search || filterLevel !== 'all' ? 'Sin resultados' : 'No hay historias aún'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <StoryCard
                key={s._id}
                story={s}
                onEdit={() => openEdit(s)}
                onDelete={() => handleDelete(s._id)}
              />
            ))}
          </div>
        )}

        {/* ── Modal form crear/editar ── */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl p-6 overflow-y-auto"
              style={{
                background: 'rgba(10,10,20,0.98)',
                border: '1px solid rgba(124,92,252,0.2)',
                backdropFilter: 'blur(20px)',
                maxHeight: '90vh',
              }}
            >
              {/* HUD corners modal */}
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
                  style={{ background: '#7c5cfc', opacity: 0.3 }}
                />
              ))}

              <div className="flex items-center justify-between mb-5">
                <div>
                  <p
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'rgba(167,139,250,0.4)' }}
                  >
                    {editId ? 'EDITAR HISTORIA' : 'NUEVA HISTORIA'}
                  </p>
                  <h3 className="font-display font-bold text-white" style={{ fontSize: 16 }}>
                    {editId ? form.title || '···' : 'Crear historia'}
                  </h3>
                </div>
                <button
                  onClick={closeForm}
                  className="font-mono transition-all"
                  style={{
                    color: 'rgba(167,139,250,0.4)',
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(167,139,250,0.4)')}
                >
                  ✕
                </button>
              </div>

              {/* Título */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
                >
                  Título
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="El León y el Ratón"
                  className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Nivel */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
                >
                  Nivel
                </label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setForm((f) => ({ ...f, level: l }))}
                      className="flex-1 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
                      style={{
                        fontSize: 9,
                        background:
                          form.level === l ? LEVEL_COLORS[l] + '15' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${form.level === l ? LEVEL_COLORS[l] + '50' : 'rgba(124,92,252,0.12)'}`,
                        color: form.level === l ? LEVEL_COLORS[l] : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {l.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto del cuento */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
                >
                  Texto del cuento
                </label>
                <textarea
                  value={form.text ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={6}
                  placeholder="Érase una vez..."
                  className="w-full px-3 py-2 rounded-lg font-serif text-sm resize-none focus:outline-none"
                  style={{ ...inputStyle, lineHeight: 1.7 }}
                />
              </div>

              {/* Imagen */}
              <div className="flex flex-col gap-1.5 mb-6">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
                >
                  Imagen de portada
                </label>
                {form.image && !imageFile && (
                  <div
                    className="relative h-24 rounded-lg overflow-hidden mb-2"
                    style={{ border: '1px solid rgba(124,92,252,0.2)' }}
                  >
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom,transparent,rgba(8,8,16,0.6))',
                      }}
                    />
                    <span
                      className="absolute bottom-2 left-3 font-mono"
                      style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}
                    >
                      IMAGEN ACTUAL
                    </span>
                  </div>
                )}
                <label
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-mono uppercase tracking-widest w-fit"
                  style={{
                    fontSize: 9,
                    color: imageFile ? '#34d399' : 'rgba(167,139,250,0.4)',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px dashed ${imageFile ? 'rgba(52,211,153,0.4)' : 'rgba(124,92,252,0.2)'}`,
                  }}
                >
                  ⬆ {imageFile ? imageFile.name.slice(0, 24) + '…' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Audio */}
              <div className="flex flex-col gap-1.5 mb-6">
                <label
                  className="font-mono uppercase tracking-widest"
                  style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)' }}
                >
                  Audio narración
                </label>

                <label
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-mono uppercase tracking-widest w-fit"
                  style={{
                    fontSize: 9,
                    color: audioFile ? '#34d399' : 'rgba(167,139,250,0.4)',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px dashed ${audioFile ? 'rgba(52,211,153,0.4)' : 'rgba(124,92,252,0.2)'}`,
                  }}
                >
                  🎧 {audioFile ? audioFile.name.slice(0, 24) + '…' : 'Subir audio'}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={closeForm}
                  className="px-5 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 9,
                    color: 'rgba(167,139,250,0.4)',
                    background: 'transparent',
                    border: '1px solid rgba(124,92,252,0.15)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 10,
                    background: saving ? 'rgba(124,92,252,0.1)' : 'rgba(124,92,252,0.22)',
                    border: '1px solid rgba(124,92,252,0.45)',
                    color: saving ? 'rgba(167,139,250,0.4)' : '#a78bfa',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? '···' : editId ? '✓ GUARDAR CAMBIOS' : '+ CREAR HISTORIA'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-xl font-mono uppercase tracking-widest whitespace-nowrap"
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
  )
}
