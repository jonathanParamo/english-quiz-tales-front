import { useState, useMemo } from 'react'
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

type SortKey = 'word' | 'type' | 'spanish'

export default function VocabularyMode() {
  const { document } = usePracticeStore()
  const { speak, playing } = useTTS()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('word')
  const [sortAsc, setSortAsc] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [voice] = useState<TTSVoiceGender>('female-us')

  if (!document) return null

  const isVerbs = document.contentType === 'verbs'

  const rows = isVerbs
    ? document.verbs.map((v) => ({
        word: v.infinitive,
        col2: v.pastSimple,
        col3: v.pastParticiple,
        spanish: v.spanish,
        example: v.example,
        type: 'verb',
      }))
    : document.vocabulary.map((v) => ({
        word: v.word,
        col2: v.type,
        col3: v.definition,
        spanish: v.spanish,
        example: v.example,
        type: v.type,
      }))

  const types = useMemo(() => {
    const set = new Set(rows.map((r) => r.type))
    return ['all', ...Array.from(set)]
  }, [rows])

  const filtered = useMemo(() => {
    let result = rows
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.word.toLowerCase().includes(q) ||
          r.spanish.toLowerCase().includes(q) ||
          r.example.toLowerCase().includes(q),
      )
    }
    if (filterType !== 'all') result = result.filter((r) => r.type === filterType)

    return [...result].sort((a, b) => {
      const av = a[sortKey === 'word' ? 'word' : sortKey === 'type' ? 'type' : 'spanish'] ?? ''
      const bv = b[sortKey === 'word' ? 'word' : sortKey === 'type' ? 'type' : 'spanish'] ?? ''
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [rows, search, filterType, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest transition-colors"
      style={{ color: sortKey === k ? '#a78bfa' : 'rgba(255,255,255,0.2)', fontSize: 9 }}
    >
      {label}
      <span style={{ fontSize: 8 }}>{sortKey === k ? (sortAsc ? '↑' : '↓') : '↕'}</span>
    </button>
  )

  const typeColors: Record<string, string> = {
    verb: '#7c5cfc',
    noun: '#34d399',
    adjective: '#f59e0b',
    adverb: '#f43f5e',
    preposition: '#06b6d4',
    pronoun: '#8b5cf6',
    conjunction: '#ec4899',
  }

  return (
    <div className="space-y-5">
      <SectionLabel icon="◈" label="Vocabulary Table" color="#34d399" />

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-40 relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs"
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}
          >
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search word, Spanish, example..."
            className="w-full rounded-xl py-2.5 pl-8 pr-3 font-mono text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(124,92,252,0.4)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          />
        </div>

        {/* Type filter */}
        {types.length > 2 && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl py-2.5 px-3 font-mono text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 10,
              outline: 'none',
            }}
          >
            {types.map((t) => (
              <option key={t} value={t} style={{ background: '#0d0d16' }}>
                {t === 'all' ? 'All types' : t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
          {filtered.length} / {rows.length} entries
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex gap-3">
          <SortBtn k="word" label="Word" />
          {!isVerbs && <SortBtn k="type" label="Type" />}
          <SortBtn k="spanish" label="ES" />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,22,0.88)', border: '1px solid rgba(124,92,252,0.1)' }}
      >
        {/* Header */}
        <div
          className="grid px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            gridTemplateColumns: isVerbs ? '1fr 1fr 1fr 1fr 40px' : '1fr 80px 1fr 1fr 40px',
          }}
        >
          {isVerbs
            ? ['Infinitive', 'Past simple', 'Past part.', 'Spanish'].map((h) => (
                <span
                  key={h}
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: 'rgba(236, 229, 229, 0.74)', fontSize: 12 }}
                >
                  {h}
                </span>
              ))
            : ['Word', 'Type', 'Definition', 'Spanish'].map((h) => (
                <span
                  key={h}
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: 'rgba(226, 218, 218, 0.43)', fontSize: 10 }}
                >
                  {h}
                </span>
              ))}
          <span />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p
              className="font-mono text-xs"
              style={{ color: 'rgba(241, 233, 233, 0.24)', fontSize: 10 }}
            >
              No results for "{search}"
            </p>
          </div>
        ) : (
          filtered.map((row, idx) => {
            const typeColor = typeColors[row.type] ?? '#7c5cfc'
            return (
              <div
                key={row.word + idx}
                className="grid px-4 py-3 border-b transition-all duration-150 group"
                style={{
                  borderColor: 'rgba(255,255,255,0.03)',
                  gridTemplateColumns: isVerbs ? '1fr 1fr 1fr 1fr 40px' : '1fr 80px 1fr 1fr 40px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,92,252,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Word */}
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                >
                  {row.word}
                </span>

                {/* Col2: past simple OR type badge */}
                {isVerbs ? (
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
                  >
                    {row.col2}
                  </span>
                ) : (
                  <span
                    className="font-mono text-xs self-start px-1.5 py-0.5 rounded w-fit"
                    style={{
                      background: typeColor + '15',
                      color: typeColor,
                      border: `1px solid ${typeColor}25`,
                      fontSize: 8,
                    }}
                  >
                    {row.col2}
                  </span>
                )}

                {/* Col3: past participle OR definition */}
                <span
                  className="font-mono text-xs pr-2"
                  style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isVerbs ? 11 : 10 }}
                >
                  {row.col3}
                </span>

                {/* Spanish */}
                <span
                  className="font-mono text-xs italic"
                  style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}
                >
                  {row.spanish}
                </span>

                {/* Play button */}
                <button
                  onClick={() =>
                    speak(
                      isVerbs
                        ? `${row.word}. Past simple: ${row.col2}. Past participle: ${row.col3}. In Spanish: ${row.spanish}. Example: ${row.example}`
                        : `${row.word}. ${row.col2}. ${row.col3}. In Spanish: ${row.spanish}. Example: ${row.example}`,
                      voice,
                    )
                  }
                  className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
                  style={{
                    background: 'rgba(124,92,252,0.15)',
                    border: '1px solid rgba(124,92,252,0.3)',
                  }}
                >
                  <span className="font-mono" style={{ color: '#a78bfa', fontSize: 8 }}>
                    ▶
                  </span>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Example panel on hover hint */}
      <p
        className="font-mono text-xs text-center"
        style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 9 }}
      >
        Hover a row to play its pronunciation
      </p>
    </div>
  )
}
