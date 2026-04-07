import { useState } from 'react'
import AiTutorChat from './Chat'
import { useUserStore } from '@/store/userStore'

export default function AiTutorBubble() {
  const [open, setOpen] = useState(false)
  const [hasNew, setHasNew] = useState(true)
  const { user } = useUserStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Ventana de chat */}
      {open && (
        <div style={{ animation: 'popIn 0.3s cubic-bezier(.16,1,.3,1) both' }}>
          <AiTutorChat
            onClose={() => setOpen(false)}
            avgScore={user?.avgScore}
            userProgress={user?.progress}
          />
        </div>
      )}

      {/* Botón FAB */}
      <button
        onClick={() => {
          setOpen((p) => !p)
          setHasNew(false)
        }}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open ? 'rgba(124,92,252,0.3)' : 'rgba(124,92,252,0.15)',
          border: '1px solid rgba(124,92,252,0.6)',
          boxShadow: '0 0 20px rgba(124,92,252,0.25)',
          color: '#a78bfa',
          fontSize: open ? 16 : 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s',
          transform: open ? 'rotate(45deg)' : 'none',
          position: 'relative',
        }}
      >
        {open ? '✕' : '✦'}

        {hasNew && !open && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 16,
              height: 16,
              background: '#f87171',
              borderRadius: '50%',
              border: '2px solid #080810',
              fontSize: 8,
              color: 'white',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            1
          </span>
        )}
      </button>

      <style>{`
        @keyframes popIn {
          from { opacity:0; transform: scale(0.85) translateY(16px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}
