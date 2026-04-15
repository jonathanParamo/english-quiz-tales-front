import { useEffect, useRef, useState, useCallback } from 'react'

export type TTSVoiceGender = 'male' | 'female-us' | 'female-uk'

interface TTSOptions {
  rate?: number
  pitch?: number
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  gender: TTSVoiceGender,
): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang.startsWith('en'))
  if (!en.length) return voices[0] ?? null

  if (gender === 'female-uk') {
    return (
      en.find((v) => v.lang === 'en-GB' && /female|woman|zira|hazel|susan/i.test(v.name)) ??
      en.find((v) => v.lang === 'en-GB') ??
      en[0]
    )
  }
  if (gender === 'male') {
    return (
      en.find((v) => /male|man|david|mark|daniel|alex/i.test(v.name)) ??
      en.find((v) => v.lang === 'en-US') ??
      en[0]
    )
  }
  // female-us (default)
  return (
    en.find(
      (v) => v.lang === 'en-US' && /female|woman|samantha|zira|victoria|karen/i.test(v.name),
    ) ??
    en.find((v) => v.lang === 'en-US') ??
    en[0]
  )
}

export function useTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [playing, setPlaying] = useState(false)
  const [supported, setSupported] = useState(true)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false)
      return
    }

    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    (text: string, gender: TTSVoiceGender = 'female-us', options: TTSOptions = {}) => {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()

      const utter = new SpeechSynthesisUtterance(text)
      const voice = pickVoice(voices, gender)
      if (voice) utter.voice = voice
      utter.rate = options.rate ?? 1
      utter.pitch = options.pitch ?? 1

      utter.onstart = () => setPlaying(true)
      utter.onend = () => setPlaying(false)
      utter.onerror = () => setPlaying(false)

      utterRef.current = utter
      window.speechSynthesis.speak(utter)
    },
    [voices],
  )

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setPlaying(false)
  }, [])

  return { speak, stop, playing, supported, voices }
}
