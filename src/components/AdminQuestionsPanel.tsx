import { useState } from 'react'
import apiFetch from '../api/apiFetch'

// ── Tipos ──────────────────────────────────────────────────────────────
type QuestionType =
  | 'multiple'
  | 'true_false'
  | 'fill_blank'
  | 'listening'
  | 'matching'
  | 'choose_correct_sentence'
  | 'write_sentence'

type Difficulty = 'easy' | 'medium' | 'hard'

interface Props {
  storyId: string
  storyTitle: string
  onCreated: () => void
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string; desc: string }[] = [
  { value: 'multiple', label: 'Opción múltiple', icon: '◉', desc: '4 opciones, 1 correcta' },
  { value: 'true_false', label: 'Verdadero / Falso', icon: '⟳', desc: 'Afirmación del cuento' },
  {
    value: 'fill_blank',
    label: 'Llenar espacio',
    icon: '＿',
    desc: 'El alumno escribe la palabra',
  },
  { value: 'listening', label: 'Escucha', icon: '♪', desc: 'Audio + pregunta' },
  { value: 'matching', label: 'Emparejar', icon: '⇄', desc: 'cat|gato, dog|perro' },
  {
    value: 'choose_correct_sentence',
    label: 'Oración correcta',
    icon: '✓',
    desc: 'Elige la oración correcta',
  },
  { value: 'write_sentence', label: 'Escribir oración', icon: '✍', desc: 'Respuesta libre' },
]

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#34d399' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'hard', label: 'Hard', color: '#f43f5e' },
]

const emptyForm = () => ({
  question: '',
  type: 'multiple' as QuestionType,
  difficulty: 'medium' as Difficulty,
  points: 1,
  explanation: '',
  sceneTag: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  matchingRaw: '',
  tfAnswer: 'true',
})

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(124,92,252,0.18)',
  borderRadius: 8,
  color: '#e8e0f0',
  outline: 'none',
} as const

const labelStyle = {
  fontSize: 9,
  color: 'rgb(200, 186, 248)',
} as const

// ── Componente ─────────────────────────────────────────────────────────
export default function AdminQuestionsPanel({ storyId, storyTitle, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm())
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  // ── Build correctAnswer según tipo ─────────────────────────────────
  const buildCorrectAnswer = (): string | string[] => {
    switch (form.type) {
      case 'true_false':
        return form.tfAnswer
      case 'matching': {
        const pairs = form.matchingRaw
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
        return JSON.stringify(pairs.map((p) => p.split('|').map((s) => s.trim())))
      }
      case 'fill_blank':
      case 'write_sentence':
      case 'listening':
        return form.correctAnswer.trim()
      case 'multiple':
      case 'choose_correct_sentence':
        return form.correctAnswer.trim()
      default:
        return form.correctAnswer.trim()
    }
  }

  // ── Validar ────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!form.question.trim()) return 'La pregunta es obligatoria'
    if (form.type === 'listening' && !audioFile) return 'Sube un audio para preguntas de escucha'
    if (form.type === 'matching' && !form.matchingRaw.trim())
      return 'Ingresa los pares (cat|gato,dog|perro)'
    if (form.type === 'multiple' || form.type === 'choose_correct_sentence') {
      const filled = form.options.filter((o) => o.trim())
      if (filled.length < 2) return 'Necesitas al menos 2 opciones'
      if (!form.correctAnswer.trim()) return 'Selecciona la respuesta correcta'
      if (!form.options.includes(form.correctAnswer))
        return 'La respuesta correcta debe ser una de las opciones'
    }
    if (
      (form.type === 'fill_blank' || form.type === 'write_sentence') &&
      !form.correctAnswer.trim()
    )
      return 'Ingresa la respuesta correcta'
    return null
  }

  // ── Guardar ────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate()
    if (err) return showToast(err, false)

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('storyId', storyId)
      fd.append('question', form.question.trim())
      fd.append('type', form.type)
      fd.append('difficulty', form.difficulty)
      fd.append('points', String(form.points))
      if (form.explanation.trim()) fd.append('explanation', form.explanation.trim())
      if (form.sceneTag.trim()) fd.append('sceneTag', form.sceneTag.trim())

      if (form.type === 'multiple' || form.type === 'choose_correct_sentence') {
        const opts = form.options.filter((o) => o.trim())
        fd.append('options', JSON.stringify(opts))
      }

      fd.append('correctAnswer', JSON.stringify(buildCorrectAnswer()))

      if (audioFile) fd.append('audio', audioFile)

      await apiFetch(`questions/story/${storyId}`, { method: 'POST', body: fd })

      setForm(emptyForm())
      setAudioFile(null)
      showToast('Pregunta creada ✓', true)
      onCreated()
    } catch (e: any) {
      showToast(e?.message ?? 'Error al guardar', false)
    } finally {
      setSaving(false)
    }
  }

  const currentType = QUESTION_TYPES.find((t) => t.value === form.type)!

  return (
    <div
      className="relative rounded-2xl p-6"
      style={{
        background: 'rgba(8,8,18,0.96)',
        border: '1px solid rgba(124,92,252,0.14)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
        />
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: 9, color: 'rgba(167,139,250,0.45)' }}
        >
          GOD PANEL · PREGUNTAS
        </span>
      </div>
      <p className="font-display font-bold text-white mb-5" style={{ fontSize: 15 }}>
        {storyTitle}
      </p>

      <div className="flex flex-col gap-4">
        {/* Selector de tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono uppercase tracking-widest" style={labelStyle}>
            Tipo de pregunta
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => set('type', t.value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                style={{
                  background:
                    form.type === t.value ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${form.type === t.value ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: form.type === t.value ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {t.icon}
                </span>
                <div>
                  <p
                    className="font-mono m-0"
                    style={{
                      fontSize: 9,
                      color: form.type === t.value ? '#e8e0f0' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {t.label}
                  </p>
                  <p
                    className="font-mono m-0"
                    style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}
                  >
                    {t.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Texto de la pregunta */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono uppercase tracking-widest" style={labelStyle}>
            Pregunta
          </label>
          <textarea
            value={form.question}
            onChange={(e) => set('question', e.target.value)}
            rows={3}
            placeholder={
              form.type === 'fill_blank'
                ? 'The cat ___ on the mat. (usa ___ para el espacio)'
                : form.type === 'matching'
                  ? 'Match the words with their translations'
                  : 'Escribe la pregunta aquí...'
            }
            className="w-full px-3 py-2 rounded-lg font-serif text-sm resize-none focus:outline-none"
            style={{ ...inputStyle, lineHeight: 1.6 }}
          />
        </div>

        {/* ── Campos específicos por tipo ── */}

        {/* MULTIPLE / CHOOSE_CORRECT_SENTENCE */}
        {(form.type === 'multiple' || form.type === 'choose_correct_sentence') && (
          <div className="flex flex-col gap-2">
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Opciones <span style={{ color: 'rgba(167,139,250,0.3)' }}>(marca la correcta)</span>
            </label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => set('correctAnswer', opt)}
                  className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background:
                      form.correctAnswer === opt && opt.trim()
                        ? 'rgba(52,211,153,0.3)'
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${form.correctAnswer === opt && opt.trim() ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {form.correctAnswer === opt && opt.trim() && (
                    <span
                      style={{
                        fontSize: 8,
                        color: '#34d399',
                        display: 'block',
                        textAlign: 'center',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
                <input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...form.options]
                    newOpts[i] = e.target.value
                    set('options', newOpts)
                    // si era la correcta, actualizar también
                    if (form.correctAnswer === opt) set('correctAnswer', e.target.value)
                  }}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
            ))}
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              Toca el círculo de la opción correcta
            </p>
          </div>
        )}

        {/* TRUE / FALSE */}
        {form.type === 'true_false' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Respuesta correcta
            </label>
            <div className="flex gap-2">
              {['true', 'false'].map((v) => (
                <button
                  key={v}
                  onClick={() => set('tfAnswer', v)}
                  className="flex-1 py-2 rounded-lg font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 10,
                    background:
                      form.tfAnswer === v
                        ? v === 'true'
                          ? 'rgba(156, 231, 204, 0.15)'
                          : 'rgba(248, 154, 170, 0.15)'
                        : 'rgba(204, 160, 160, 0.02)',
                    border: `1px solid ${form.tfAnswer === v ? (v === 'true' ? '#34d399' : '#f43f5e') : 'rgba(228, 176, 176, 0.07)'}`,
                    color:
                      form.tfAnswer === v
                        ? v === 'true'
                          ? '#34d399'
                          : '#f43f5e'
                        : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {v === 'true' ? '✓ True' : '✕ False'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FILL_BLANK / WRITE_SENTENCE */}
        {(form.type === 'fill_blank' || form.type === 'write_sentence') && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Respuesta correcta
            </label>
            <input
              value={form.correctAnswer}
              onChange={(e) => set('correctAnswer', e.target.value)}
              placeholder={form.type === 'fill_blank' ? 'sleeps' : 'The cat sleeps on the mat.'}
              className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>
        )}

        {/* LISTENING */}
        {form.type === 'listening' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono uppercase tracking-widest" style={labelStyle}>
                Audio (.mp3 / .wav)
              </label>
              <label
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-mono uppercase tracking-widest w-full"
                style={{
                  fontSize: 9,
                  color: audioFile ? '#34d399' : 'rgba(208, 198, 240, 0.4)',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px dashed ${audioFile ? 'rgba(52,211,153,0.4)' : 'rgba(174, 158, 240, 0.2)'}`,
                }}
              >
                <span style={{ fontSize: 14 }}>🎧</span>
                {audioFile
                  ? audioFile.name.slice(0, 28) + (audioFile.name.length > 28 ? '…' : '')
                  : 'Subir audio'}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono uppercase tracking-widest" style={labelStyle}>
                Respuesta correcta
              </label>
              <input
                value={form.correctAnswer}
                onChange={(e) => set('correctAnswer', e.target.value)}
                placeholder="Lo que el audio dice / pide"
                className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* MATCHING */}
        {form.type === 'matching' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Pares{' '}
              <span style={{ color: 'rgba(198, 180, 252, 0.3)' }}>en|es separados por coma</span>
            </label>
            <textarea
              value={form.matchingRaw}
              onChange={(e) => set('matchingRaw', e.target.value)}
              rows={3}
              placeholder="cat|gato, dog|perro, bird|pájaro"
              className="w-full px-3 py-2 rounded-lg font-serif text-sm resize-none focus:outline-none"
              style={{ ...inputStyle, lineHeight: 1.6 }}
            />
            {/* Preview */}
            {form.matchingRaw.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.matchingRaw.split(',').map((p, i) => {
                  const [a, b] = p.split('|').map((s) => s.trim())
                  if (!a) return null
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{
                        background: 'rgba(124,92,252,0.1)',
                        border: '1px solid rgba(124,92,252,0.2)',
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: 9, color: '#d4c8fa' }}>
                        {a}
                      </span>
                      <span style={{ fontSize: 8, color: 'rgba(236, 199, 199, 0.2)' }}>↔</span>
                      <span className="font-mono" style={{ fontSize: 9, color: '#34d399' }}>
                        {b ?? '?'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Dificultad + Puntos */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Dificultad
            </label>
            <div className="flex gap-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set('difficulty', d.value)}
                  className="flex-1 py-1.5 rounded-lg font-mono uppercase tracking-widest transition-all"
                  style={{
                    fontSize: 8,
                    background:
                      form.difficulty === d.value ? d.color + '18' : 'rgba(218, 182, 182, 0.02)',
                    border: `1px solid ${form.difficulty === d.value ? d.color + '60' : 'rgba(212, 182, 182, 0.07)'}`,
                    color: form.difficulty === d.value ? d.color : 'rgba(233, 210, 210, 0.25)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5" style={{ width: 72 }}>
            <label className="font-mono uppercase tracking-widest" style={labelStyle}>
              Puntos
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.points}
              onChange={(e) => set('points', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg font-mono text-center focus:outline-none"
              style={{ ...inputStyle, fontSize: 14, color: '#a78bfa' }}
            />
          </div>
        </div>

        {/* Explicación opcional */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono uppercase tracking-widest" style={labelStyle}>
            Explicación{' '}
            <span style={{ color: 'rgba(230, 225, 248, 0.62)' }}>
              (opcional — se muestra al fallar)
            </span>
          </label>
          <input
            value={form.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            placeholder="Porque el gato..."
            className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Scene tag opcional */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono uppercase tracking-widest" style={labelStyle}>
            Scene tag <span style={{ color: 'rgba(206, 195, 240, 0.25)' }}>(opcional)</span>
          </label>
          <input
            value={form.sceneTag}
            onChange={(e) => set('sceneTag', e.target.value)}
            placeholder="intro, middle, end..."
            className="w-full px-3 py-2 rounded-lg font-serif text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-mono uppercase tracking-widest transition-all mt-1"
          style={{
            fontSize: 10,
            background: saving ? 'rgba(124,92,252,0.08)' : 'rgba(124,92,252,0.2)',
            border: '1px solid rgba(124,92,252,0.45)',
            color: saving ? 'rgba(229, 222, 250, 0.3)' : '#a78bfa',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '···' : `+ CREAR PREGUNTA · ${currentType.icon} ${currentType.label}`}
        </button>
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
