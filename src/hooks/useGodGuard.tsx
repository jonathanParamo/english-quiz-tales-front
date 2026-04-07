import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'

export function useGodGuard() {
  const { user } = useUserStore()
  const isGod = user?.role === 'god'
  const loading = user === undefined
  return { isGod, loading, role: user?.role ?? null }
}

export function GodOnly({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { isGod, loading } = useGodGuard()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#080810' }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#7c5cfc', boxShadow: '0 0 12px #7c5cfc' }}
        />
      </div>
    )
  }

  if (!isGod) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#080810' }}
      >
        <div className="relative flex flex-col items-center gap-3 p-10">
          {/* HUD corners rojo */}
          {[
            ['top-0 left-0', 'w-4 h-px'],
            ['top-0 left-0', 'w-px h-4'],
            ['top-0 right-0', 'w-4 h-px'],
            ['top-0 right-0', 'w-px h-4'],
            ['bottom-0 left-0', 'w-4 h-px'],
            ['bottom-0 left-0', 'w-px h-4'],
            ['bottom-0 right-0', 'w-4 h-px'],
            ['bottom-0 right-0', 'w-px h-4'],
          ].map(([pos, size], i) => (
            <div
              key={i}
              className={`absolute ${pos} ${size}`}
              style={{ background: '#f43f5e', opacity: 0.4 }}
            />
          ))}

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <span style={{ color: 'rgba(244,63,94,0.6)', fontSize: 20 }}>✕</span>
          </div>

          <p
            className="font-mono uppercase tracking-widest"
            style={{ color: 'rgba(244,63,94,0.5)', fontSize: 10 }}
          >
            ACCESS DENIED
          </p>
          <p className="font-mono" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>
            Rol god requerido
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-2 font-mono uppercase tracking-widest transition-all px-4 py-2 rounded-lg"
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            ← Volver al inicio
          </button>
        </div>

        {/* HUD bar inferior */}
        <div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2"
          style={{ background: 'rgba(8,8,16,0.9)', borderTop: '1px solid rgba(244,63,94,0.08)' }}
        >
          <span className="font-mono" style={{ color: 'rgba(244,63,94,0.3)', fontSize: 9 }}>
            SYS::AUTH_GUARD
          </span>
          <span className="font-mono" style={{ color: 'rgba(244,63,94,0.3)', fontSize: 9 }}>
            ERR::403
          </span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
