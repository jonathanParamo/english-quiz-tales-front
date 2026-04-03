import { useState, useEffect } from 'react'

interface Question {
  _id: string
  question: string
  type: 'multiple' | 'true_false' | 'fill_blank' | 'write_sentence' | 'choose_correct_sentence' | 'matching'
  options?: any[]
  audioUrl?: string
  selected?: any
}

interface Props {
  question: Question
  index: number
  onAnswer: (questionId: string, value: any) => void
}

export default function QuestionItem({ question, index, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(question.selected || null)
  const [typed, setTyped] = useState<string>(question.selected || '')
  const [pairs, setPairs] = useState<string[]>(
    question.options?.map(() => '') || []
  )

  const pick = (option: string) => {
    setSelected(option)
    onAnswer(question._id, option)
  }

  useEffect(() => {
    onAnswer(question._id, typed)
  }, [typed])

  useEffect(() => {
    onAnswer(question._id, pairs)
  }, [pairs])

  const optionBase =
    'w-full text-left px-4 py-3 rounded-xl border font-body text-sm transition-all duration-150 cursor-pointer'
  const optionIdle =
    'border-white/10 bg-white/5 text-white/70 hover:bg-accent/10 hover:border-accent/40 hover:text-white'
  const optionActive =
    'border-accent bg-accent/20 text-white font-medium'

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
      {/* Número + pregunta */}
      <div className="flex items-start gap-3 mb-5">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-display font-bold">
          {index + 1}
        </span>
        <p className="font-body text-white/90 leading-relaxed">{question.question}</p>
      </div>

      {/* Audio opcional */}
      {question.audioUrl && (
        <audio
          src={question.audioUrl}
          controls
          className="w-full mb-4 rounded-lg opacity-70"
        />
      )}

      {/* Selección múltiple */}
      {(question.type === 'multiple' || question.type === 'choose_correct_sentence') && (
        <div className="space-y-2">
          {question.options?.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => pick(opt)}
              className={`${optionBase} ${selected === opt ? optionActive : optionIdle}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs
                  ${selected === opt ? 'border-accent bg-accent text-white' : 'border-white/20'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Verdadero / Falso */}
      {question.type === 'true_false' && (
        <div className="flex gap-3">
          {['True', 'False'].map((opt) => (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`flex-1 py-3 rounded-xl border font-display font-semibold text-sm transition-all
                ${selected === opt ? optionActive : optionIdle}`}
            >
              {opt === 'True' ? '✓ True' : '✗ False'}
            </button>
          ))}
        </div>
      )}

      {/* Fill in the blank / Write sentence */}
      {(question.type === 'fill_blank' || question.type === 'write_sentence') && (
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={question.type === 'fill_blank' ? 'Fill in the blank...' : 'Write the sentence...'}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-accent/60 transition font-body"
        />
      )}

      {/* Matching */}
      {question.type === 'matching' && (
        <div className="space-y-3">
          {question.options?.map((pair: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="bg-accent/10 border border-accent/20 text-accent text-sm font-body px-3 py-2 rounded-lg min-w-max">
                {pair.left}
              </span>
              <span className="text-white/20">→</span>
              <select
                value={pairs[i] || ''}
                onChange={(e) => {
                  const next = [...pairs]
                  next[i] = e.target.value
                  setPairs(next)
                }}
                className="flex-1 bg-surface border border-white/10 rounded-xl px-3 py-2 text-white font-body text-sm focus:outline-none focus:border-accent/60 transition"
              >
                <option value="" disabled>Select...</option>
                {pair.rightOptions?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
