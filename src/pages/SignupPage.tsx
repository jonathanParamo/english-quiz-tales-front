import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import ParticlesBg from '../components/effects/ParticlesBg'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Marco holográfico — igual que Login pero con acento cyan/verde ────────────
function HoloFrame({ width = 3.6, height = 5.8 }: { width?: number; height?: number }) {
  const dotsRef = useRef<THREE.Points>(null!)
  const cornersRef = useRef<THREE.LineSegments>(null!)
  const scanRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  const { dotPositions, dotOffsets } = (() => {
    const COUNT = 80
    const pos = new Float32Array(COUNT * 3)
    const offsets = new Float32Array(COUNT)
    const perimeter = 2 * (width + height)
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT) * perimeter
      offsets[i] = i / COUNT
      let x = 0,
        y = 0
      if (t < width) {
        x = -width / 2 + t
        y = -height / 2
      } else if (t < width + height) {
        x = width / 2
        y = -height / 2 + (t - width)
      } else if (t < 2 * width + height) {
        x = width / 2 - (t - width - height)
        y = height / 2
      } else {
        x = -width / 2
        y = height / 2 - (t - 2 * width - height)
      }
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = 0.01
    }
    return { dotPositions: pos, dotOffsets: offsets }
  })()

  const cornerLines = (() => {
    const L = 0.35
    const corners = [
      [-width / 2, height / 2],
      [-width / 2 + L, height / 2],
      [-width / 2, height / 2],
      [-width / 2, height / 2 - L],
      [width / 2, height / 2],
      [width / 2 - L, height / 2],
      [width / 2, height / 2],
      [width / 2, height / 2 - L],
      [-width / 2, -height / 2],
      [-width / 2 + L, -height / 2],
      [-width / 2, -height / 2],
      [-width / 2, -height / 2 + L],
      [width / 2, -height / 2],
      [width / 2 - L, -height / 2],
      [width / 2, -height / 2],
      [width / 2, -height / 2 + L],
    ]
    const pos = new Float32Array(corners.length * 3)
    corners.forEach(([x, y], i) => {
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = 0.02
    })
    return pos
  })()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (dotsRef.current) {
      const pos = dotsRef.current.geometry.attributes.position.array as Float32Array
      const perimeter = 2 * (width + height)
      for (let i = 0; i < 80; i++) {
        const progress = ((dotOffsets[i] + t * 0.12) % 1) * perimeter
        let x = 0,
          y = 0
        if (progress < width) {
          x = -width / 2 + progress
          y = -height / 2
        } else if (progress < width + height) {
          x = width / 2
          y = -height / 2 + (progress - width)
        } else if (progress < 2 * width + height) {
          x = width / 2 - (progress - width - height)
          y = height / 2
        } else {
          x = -width / 2
          y = height / 2 - (progress - 2 * width - height)
        }
        pos[i * 3] = x
        pos[i * 3 + 1] = y
      }
      dotsRef.current.geometry.attributes.position.needsUpdate = true
      const mat = dotsRef.current.material as THREE.PointsMaterial
      // Acento cyan en vez de morado
      mat.opacity = 0.6 + Math.sin(t * 3) * 0.3
    }
    if (scanRef.current) {
      scanRef.current.position.y = height / 2 - ((t * 0.8) % (height + 0.5))
      ;(scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(t * 2) * 0.02
    }
    if (glowRef.current) {
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.025 + Math.sin(t * 1.5) * 0.015
    }
    if (cornersRef.current) {
      ;(cornersRef.current.material as THREE.LineBasicMaterial).opacity =
        0.7 + Math.sin(t * 4) * 0.3
    }
  })

  return (
    <group>
      <mesh ref={glowRef}>
        <planeGeometry args={[width + 0.8, height + 0.8]} />
        <meshBasicMaterial
          color="#34d399"
          transparent
          opacity={0.025}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={scanRef}>
        <planeGeometry args={[width - 0.05, 0.06]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#34d399"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={cornersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cornerLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#6ee7b7"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

function FrameCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <HoloFrame />
    </Canvas>
  )
}

// ── Insignia de beneficio ─────────────────────────────────────────────────────
function Perk({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span className="font-mono text-xs" style={{ color: 'rgba(52,211,153,0.7)', fontSize: 10 }}>
        {text}
      </span>
    </div>
  )
}

// ── SignupPage ────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, loading, error, clearError } = useUserStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [role, setRole] = useState<'student' | 'creator'>('student')

  // Indicador de fuerza de contraseña
  const pwStrength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 6) s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return Math.min(s, 4)
  })()

  const strengthLabel = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'][pwStrength]
  const strengthColors = ['', '#f43f5e', '#f59e0b', '#34d399', '#7c5cfc']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = await signup(username, email, password, role)
    if (ok) navigate('/home')
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#080810' }}
    >
      <ParticlesBg />

      {/* Gradiente radial — acento verde para diferenciar del login */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-xs"
        style={{ animation: 'slideUp 0.6s cubic-bezier(.16,1,.3,1) both' }}
      >
        {/* Título — idéntico al login */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-3">
            <span
              className="absolute inset-0 blur-2xl opacity-60"
              style={{ background: 'linear-gradient(135deg,#7c5cfc,#34d399)', borderRadius: 99 }}
            />
            <h1
              className="relative font-display font-black tracking-tight leading-none select-none"
              style={{
                fontSize: 42,
                background: 'linear-gradient(135deg, #e0d7ff 0%, #a78bfa 40%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              ENGLISH
            </h1>
            <h1
              className="relative font-display font-black tracking-tight leading-none select-none"
              style={{
                fontSize: 42,
                background: 'linear-gradient(135deg, #7c5cfc 0%, #a78bfa 60%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              TALES
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(52,211,153,0.4))' }}
            />
            <span
              className="text-xs font-body tracking-widest uppercase"
              style={{ color: 'rgba(52,211,153,0.6)', fontSize: 10 }}
            >
              Learn through stories
            </span>
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg,rgba(52,211,153,0.4),transparent)' }}
            />
          </div>
        </div>

        {/* Panel */}
        <div className="relative" style={{ padding: '2px' }}>
          <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
            <FrameCanvas />
          </div>

          <div
            className="relative z-10 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,13,22,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(52,211,153,0.08)',
            }}
          >
            {/* Header terminal — acento verde */}
            <div
              className="flex items-center gap-2 px-5 py-3 border-b"
              style={{ borderColor: 'rgba(52,211,153,0.1)', background: 'rgba(52,211,153,0.04)' }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }}
              />
              <span
                className="font-mono text-xs tracking-widest uppercase"
                style={{ color: 'rgba(52,211,153,0.5)', fontSize: 10 }}
              >
                NEW_PLAYER
              </span>
              <div className="ml-auto flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: `rgba(52,211,153,${0.2 + i * 0.15})` }}
                  />
                ))}
              </div>
            </div>

            <div className="p-7">
              {/* Cabecera motivacional */}
              <div className="mb-5">
                <h2 className="font-display font-bold text-white text-[20px] leading-tight">
                  Begin your journey
                </h2>
                <p
                  className="font-mono text-xs mt-0.5"
                  style={{ color: 'rgb(52,211,153)', fontSize: 13 }}
                >
                  {'> CREATE YOUR ACCOUNT_'}
                </p>
              </div>

              {/* Perks rápidos — motivación sutil */}
              <div
                className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5 mb-5"
                style={{
                  background: 'rgba(52,211,153,0.04)',
                  border: '1px solid rgba(52,211,153,0.08)',
                }}
              >
                <Perk icon="📖" text="STORIES · Unlock interactive tales" />
                <Perk icon="⚡" text="XP · Track your progress" />
                <Perk icon="🏆" text="FREE · No credit card needed" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label
                    className="block font-mono mb-1.5 uppercase tracking-widest"
                    style={{
                      color:
                        focusedField === 'username'
                          ? 'rgba(52,211,153,0.9)'
                          : 'rgba(245,238,238,0.94)',
                      fontSize: 10,
                      transition: 'color 0.2s',
                    }}
                  >
                    · Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="hero_of_realm"
                      required
                      className="w-full font-mono text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-200"
                      style={{
                        background:
                          focusedField === 'username'
                            ? 'rgba(52,211,153,0.06)'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${focusedField === 'username' ? 'rgba(52,211,153,0.4)' : 'rgba(255,247,247,0.07)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow:
                          focusedField === 'username'
                            ? '0 0 0 3px rgba(52,211,153,0.07), inset 0 0 20px rgba(52,211,153,0.03)'
                            : 'none',
                        fontSize: 13,
                      }}
                    />
                    {focusedField === 'username' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-1 h-4 rounded-full animate-pulse"
                          style={{ background: '#34d399' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    className="block font-mono mb-1.5 uppercase tracking-widest"
                    style={{
                      color:
                        focusedField === 'email'
                          ? 'rgba(52,211,153,0.9)'
                          : 'rgba(245,238,238,0.94)',
                      fontSize: 10,
                      transition: 'color 0.2s',
                    }}
                  >
                    · Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="player@realm.io"
                      required
                      className="w-full font-mono text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-200"
                      style={{
                        background:
                          focusedField === 'email'
                            ? 'rgba(52,211,153,0.06)'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${focusedField === 'email' ? 'rgba(52,211,153,0.4)' : 'rgba(255,247,247,0.07)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow:
                          focusedField === 'email'
                            ? '0 0 0 3px rgba(52,211,153,0.07), inset 0 0 20px rgba(52,211,153,0.03)'
                            : 'none',
                        fontSize: 13,
                      }}
                    />
                    {focusedField === 'email' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-1 h-4 rounded-full animate-pulse"
                          style={{ background: '#34d399' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password + strength meter */}
                <div>
                  <label
                    className="block font-mono mb-1.5 uppercase tracking-widest"
                    style={{
                      color:
                        focusedField === 'password'
                          ? 'rgba(52,211,153,0.9)'
                          : 'rgba(245,238,238,0.94)',
                      fontSize: 10,
                      transition: 'color 0.2s',
                    }}
                  >
                    · Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••••"
                      required
                      className="w-full font-mono text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-200"
                      style={{
                        background:
                          focusedField === 'password'
                            ? 'rgba(52,211,153,0.06)'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${focusedField === 'password' ? 'rgba(52,211,153,0.4)' : 'rgba(255,247,247,0.07)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow:
                          focusedField === 'password'
                            ? '0 0 0 3px rgba(52,211,153,0.07), inset 0 0 20px rgba(52,211,153,0.03)'
                            : 'none',
                        fontSize: 13,
                        letterSpacing: password ? '0.2em' : 'normal',
                      }}
                    />
                    {focusedField === 'password' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-1 h-4 rounded-full animate-pulse"
                          style={{ background: '#34d399' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Rol */}
                  <div>
                    <label
                      className="block font-mono mb-1.5 uppercase tracking-widest"
                      style={{ color: 'rgba(245,238,238,0.94)', fontSize: 10 }}
                    >
                      · Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['student', 'creator'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className="font-mono uppercase tracking-widest transition-all duration-200"
                          style={{
                            padding: '9px',
                            borderRadius: 10,
                            fontSize: 10,
                            border: `1px solid ${role === r ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.07)'}`,
                            background:
                              role === r ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                            color: role === r ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.3)',
                            boxShadow: role === r ? '0 0 0 3px rgba(52,211,153,0.07)' : 'none',
                          }}
                        >
                          {r === 'student' ? '📖 Student' : '✏️ Creator'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strength meter */}
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-0.5 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background:
                                i <= pwStrength
                                  ? strengthColors[pwStrength]
                                  : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="font-mono text-xs"
                        style={{ color: strengthColors[pwStrength], fontSize: 9 }}
                      >
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                    style={{
                      background: 'rgba(244,63,94,0.08)',
                      border: '1px solid rgba(244,63,94,0.2)',
                    }}
                  >
                    <span
                      className="text-xs font-mono mt-0.5"
                      style={{ color: 'rgba(244,63,94,0.7)', fontSize: 10 }}
                    >
                      ERR
                    </span>
                    <p className="text-xs font-body" style={{ color: 'rgba(244,63,94,0.9)' }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Botón — verde en signup */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden font-display font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(52,211,153,0.3)'
                      : 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    borderRadius: 10,
                    padding: '13px',
                    color: 'white',
                    boxShadow: loading
                      ? 'none'
                      : '0 0 20px rgba(52,211,153,0.25), 0 4px 12px rgba(52,211,153,0.15)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {!loading && (
                    <div
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                      }}
                    />
                  )}
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="font-mono text-xs tracking-widest">CREATING ACCOUNT...</span>
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      <span>Start Adventure</span>
                      <span style={{ opacity: 0.7 }}>→</span>
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div
                className="mt-6 pt-5 flex items-center gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="h-px flex-1" style={{ background: 'rgba(52,211,153,0.15)' }} />
                <p
                  className="font-mono text-xs"
                  style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                >
                  ALREADY PLAYING?{' '}
                  <Link
                    to="/login"
                    className="font-bold transition-all"
                    style={{ color: 'rgba(52,211,153,0.8)' }}
                  >
                    SIGN IN
                  </Link>
                </p>
                <div className="h-px flex-1" style={{ background: 'rgba(52,211,153,0.15)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Coordenadas decorativas */}
        <div className="flex justify-between mt-4 px-1">
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(52,211,153,0.25)', fontSize: 9 }}
          >
            SYS::REGISTER_MODULE
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(52,211,153,0.25)', fontSize: 9 }}
          >
            v2.0.1
          </span>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
