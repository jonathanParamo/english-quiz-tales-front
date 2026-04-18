import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePracticeStore } from '@/store/usePracticeStore'
import ParticlesBg from '@/components/effects/ParticlesBg'
import ListenMode from '@/components/practice/ListenMode'
import VocabularyMode from '@/components/practice/VocabularyMode'
import WritingMode from '@/components/practice/WritingMode'
import QuizMode from '@/components/practice/QuizMode'
import type { PracticeMode } from '@/store/usePracticeStore'
import DictationMode from '@/components/practice/DictationMode'
import ShadowingMode from '@/components/practice/ShadowingMode'

// ── Helpers ────────────────────────────────────────────────────────────────

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

const MODES: { id: PracticeMode; icon: string; label: string; sub: string }[] = [
  { id: 'listen', icon: '◉', label: 'Listen', sub: 'Audio & pronunciation' },
  { id: 'vocabulary', icon: '◈', label: 'Vocabulary', sub: 'Table & meaning' },
  { id: 'writing', icon: '◆', label: 'Writing', sub: 'Practice & feedback' },
  { id: 'quiz', icon: '◎', label: 'Quiz', sub: 'Test yourself' },
  { id: 'dictation', icon: '✎', label: 'Dictation', sub: 'Listen & write' },
  { id: 'shadowing', icon: '🎤', label: 'Shadowing', sub: 'Speak & mimic' },
]

// ── Upload Screen ──────────────────────────────────────────────────────────

function UploadScreen() {
  const { uploadDocument, documentLoading } = usePracticeStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const handle = async (file: File) => {
    setError('')
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      setError('ERR::FORMAT_NOT_SUPPORTED — PDF or DOCX only')
      return
    }
    const result = await uploadDocument(file)
    if (!result) setError('ERR::UPLOAD_FAILED — Try again')
  }

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: '#080810' }}>
      <ParticlesBg />
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#7c5cfc', boxShadow: '0 0 6px #7c5cfc' }}
            />
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: 'rgba(124,92,252,0.6)', fontSize: 9 }}
            >
              PRACTICE MODULE
            </span>
          </div>
          <h1 className="font-display font-black text-white mb-2" style={{ fontSize: 32 }}>
            Upload Document
          </h1>
          <p
            className="font-mono text-xs"
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          >
            PDF or DOCX — verbs, vocabulary, stories, anything
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="w-full max-w-md relative"
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) handle(f)
          }}
        >
          <button
            onClick={() => inputRef.current?.click()}
            disabled={documentLoading}
            className="w-full rounded-2xl py-16 flex flex-col items-center gap-5 transition-all duration-300 relative overflow-hidden"
            style={{
              background: dragging ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.015)',
              border: `1.5px dashed ${dragging ? 'rgba(124,92,252,0.6)' : 'rgba(124,92,252,0.2)'}`,
            }}
          >
            {documentLoading ? (
              <>
                <div className="relative w-14 h-14">
                  <div
                    className="absolute inset-0 rounded-full border border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(124,92,252,0.2)', borderTopColor: '#7c5cfc' }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-b-transparent animate-spin"
                    style={{
                      borderColor: 'rgba(167,139,250,0.1)',
                      borderBottomColor: '#a78bfa',
                      animationDuration: '0.65s',
                      animationDirection: 'reverse',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: '#7c5cfc', boxShadow: '0 0 8px #7c5cfc' }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p
                    className="font-mono text-xs uppercase tracking-widest animate-pulse"
                    style={{ color: 'rgba(124,92,252,0.7)', fontSize: 10 }}
                  >
                    Analyzing document...
                  </p>
                  <p
                    className="font-mono text-xs mt-1"
                    style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}
                  >
                    AI is structuring your content
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(124,92,252,0.08)',
                    border: '1px solid rgba(124,92,252,0.2)',
                  }}
                >
                  <span style={{ fontSize: 28 }}>📄</span>
                </div>
                <div className="text-center">
                  <p
                    className="font-mono text-xs uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  >
                    Drop file here or click to browse
                  </p>
                  <p
                    className="font-mono text-xs"
                    style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9 }}
                  >
                    PDF · DOCX · DOC supported
                  </p>
                </div>
                {/* Format pills */}
                <div className="flex gap-2">
                  {['PDF', 'DOCX', 'DOC'].map((f) => (
                    <span
                      key={f}
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{
                        color: 'rgba(124,92,252,0.5)',
                        background: 'rgba(124,92,252,0.06)',
                        border: '1px solid rgba(124,92,252,0.15)',
                        fontSize: 9,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handle(f)
            }}
          />
        </div>

        {error && (
          <p
            className="mt-4 font-mono text-xs"
            style={{ color: 'rgba(244,63,94,0.7)', fontSize: 10 }}
          >
            {error}
          </p>
        )}

        {/* What AI detects */}
        <div className="mt-10 w-full max-w-md">
          <SectionLabel icon="◈" label="What the AI detects" color="rgba(255,255,255,0.12)" />
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: '◉',
                label: 'Irregular verbs',
                sub: 'infinitive · past · participle',
                color: '#7c5cfc',
              },
              {
                icon: '◈',
                label: 'Vocabulary lists',
                sub: 'word · type · definition',
                color: '#34d399',
              },
              {
                icon: '◆',
                label: 'Stories & texts',
                sub: 'paragraphs ready for TTS',
                color: '#f59e0b',
              },
              {
                icon: '◎',
                label: 'Mixed content',
                sub: 'vocab + story combined',
                color: '#f43f5e',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono" style={{ color: item.color, fontSize: 10 }}>
                    {item.icon}
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  >
                    {item.label}
                  </span>
                </div>
                <p
                  className="font-mono text-xs"
                  style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                >
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PracticePage() {
  const navigate = useNavigate()
  const { document, activeMode, setActiveMode, reset } = usePracticeStore()

  if (!document) return <UploadScreen />

  const contentColor =
    document.contentType === 'verbs'
      ? '#7c5cfc'
      : document.contentType === 'vocabulary'
        ? '#34d399'
        : document.contentType === 'story'
          ? '#f59e0b'
          : '#f43f5e'

  return (
    <div className="min-h-screen relative" style={{ background: '#080810' }}>
      <ParticlesBg />

      {/* ── Top nav ── */}
      <div
        className="sticky top-0 z-40 px-5 py-2.5 flex items-center gap-3"
        style={{
          background: 'rgba(8,8,16,0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,92,252,0.1)',
        }}
      >
        <button
          onClick={() => {
            reset()
            navigate('/home')
          }}
          className="font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1 px-2 py-1 rounded"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, border: '1px solid transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#a78bfa'
            e.currentTarget.style.borderColor = 'rgba(124,92,252,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          ← Base
        </button>
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <h1 className="font-display font-bold text-white truncate flex-1" style={{ fontSize: 13 }}>
          {document.title || document.originalName}
        </h1>
        <span
          className="font-mono text-xs px-2 py-0.5 rounded"
          style={{
            color: contentColor,
            background: contentColor + '12',
            border: `1px solid ${contentColor}25`,
            fontSize: 9,
          }}
        >
          {document.contentType.toUpperCase()}
        </span>
        <button
          onClick={() => reset()}
          className="font-mono text-xs px-2 py-1 rounded transition-all"
          style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: 9,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f43f5e'
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          NEW DOC
        </button>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-28 space-y-7">
        {/* Doc info */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: contentColor, boxShadow: `0 0 5px ${contentColor}` }}
            />
            <span
              className="font-mono text-xs uppercase"
              style={{ color: contentColor, fontSize: 9 }}
            >
              PRACTICE MODULE · {document.contentType.toUpperCase()}
            </span>
          </div>
          <h1 className="font-display font-black text-white mb-2" style={{ fontSize: 28 }}>
            {document.title || document.originalName}
          </h1>
          {document.summary && (
            <p
              className="font-body text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 520 }}
            >
              {document.summary}
            </p>
          )}
        </div>

        {/* Mode tabs */}
        <div>
          <SectionLabel icon="◎" label="Practice Mode" color="rgba(255,255,255,0.15)" />
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => {
              const active = activeMode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className="rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all duration-200"
                  style={{
                    background: active ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <span
                    className="font-mono"
                    style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.2)', fontSize: 14 }}
                  >
                    {m.icon}
                  </span>
                  <span
                    className="font-mono text-xs uppercase font-bold"
                    style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontSize: 9 }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="font-mono text-center leading-tight"
                    style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8 }}
                  >
                    {m.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mode content */}
        {activeMode === 'listen' && <ListenMode />}
        {activeMode === 'vocabulary' && <VocabularyMode />}
        {activeMode === 'writing' && <WritingMode />}
        {activeMode === 'dictation' && <DictationMode />}
        {activeMode === 'shadowing' && <ShadowingMode />}
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-2"
        style={{ background: 'rgba(8,8,16,0.96)', borderTop: `1px solid ${contentColor}15` }}
      >
        <span className="font-mono text-xs" style={{ color: 'rgba(124,92,252,0.3)', fontSize: 9 }}>
          SYS::PRACTICE_ACTIVE
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: '#34d399', boxShadow: '0 0 4px #34d399' }}
            />
            <span
              className="font-mono text-xs"
              style={{ color: 'rgba(52,211,153,0.45)', fontSize: 9 }}
            >
              LIVE
            </span>
          </div>
          <span className="font-mono text-xs" style={{ color: `${contentColor}50`, fontSize: 9 }}>
            {document.originalName}
          </span>
        </div>
      </div>
    </div>
  )
}
