import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import ParticlesBg from '../components/effects/ParticlesBg'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function HoloFrame({ width = 3.6, height = 5.2 }: { width?: number; height?: number }) {
  const dotsRef = useRef<THREE.Points>(null!)
  const cornersRef = useRef<THREE.LineSegments>(null!)
  const scanRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  // Puntos que corren por los bordes del rectángulo
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

  // Líneas de esquinas estilo HUD
  const cornerLines = (() => {
    const L = 0.35 // largo de cada segmento de esquina
    const corners = [
      // top-left
      [-width / 2, height / 2],
      [-width / 2 + L, height / 2],
      [-width / 2, height / 2],
      [-width / 2, height / 2 - L],
      // top-right
      [width / 2, height / 2],
      [width / 2 - L, height / 2],
      [width / 2, height / 2],
      [width / 2, height / 2 - L],
      // bottom-left
      [-width / 2, -height / 2],
      [-width / 2 + L, -height / 2],
      [-width / 2, -height / 2],
      [-width / 2, -height / 2 + L],
      // bottom-right
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
      const COUNT = 80
      const perimeter = 2 * (width + height)

      for (let i = 0; i < COUNT; i++) {
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
      mat.opacity = 0.6 + Math.sin(t * 3) * 0.3
    }

    if (scanRef.current) {
      const y = height / 2 - ((t * 0.8) % (height + 0.5))
      scanRef.current.position.y = y
      const mat = scanRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.04 + Math.sin(t * 2) * 0.02
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.025 + Math.sin(t * 1.5) * 0.015
    }

    if (cornersRef.current) {
      const mat = cornersRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.7 + Math.sin(t * 4) * 0.3
    }
  })

  return (
    <group>
      {/* Glow exterior difuso */}
      <mesh ref={glowRef}>
        <planeGeometry args={[width + 0.8, height + 0.8]} />
        <meshBasicMaterial
          color="#7c5cfc"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Scanline */}
      <mesh ref={scanRef}>
        <planeGeometry args={[width - 0.05, 0.06]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.05} depthWrite={false} />
      </mesh>

      {/* Puntos corriendo por el borde */}
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#7c5cfc"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Líneas de esquina HUD */}
      <lineSegments ref={cornersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cornerLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

// ── Canvas del marco ─────────────────────────────────────────────────────────
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

// ── LoginPage principal ──────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, clearError } = useUserStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = await login(email, password)
    if (ok) navigate('/home')
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#080810' }}
    >
      {/* Fondo de partículas */}
      <ParticlesBg />

      {/* Gradiente radial sutil centrado */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,92,252,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Contenedor del form con el canvas del marco encima */}
      <div
        className="relative z-10 w-full max-w-xs"
        style={{ animation: 'slideUp 0.6s cubic-bezier(.16,1,.3,1) both' }}
      >
        {/* Título fuera del box */}
        <div className="text-center mb-10">
          <div className="inline-block relative mb-3">
            <span
              className="absolute inset-0 blur-2xl opacity-60"
              style={{
                background: 'linear-gradient(135deg,#7c5cfc,#34d399)',
                borderRadius: 99,
              }}
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
              style={{
                background: 'linear-gradient(90deg,transparent,rgba(124,92,252,0.5))',
              }}
            />
            <span
              className="text-xs font-body tracking-widest uppercase"
              style={{ color: 'rgba(167,139,250,0.6)', fontSize: 10 }}
            >
              Learn through stories
            </span>
            <div
              className="h-px flex-1"
              style={{
                background: 'linear-gradient(90deg,rgba(124,92,252,0.5),transparent)',
              }}
            />
          </div>
        </div>

        {/* Box del form con canvas del marco encima */}
        <div className="relative" style={{ padding: '2px' }}>
          {/* Canvas Three.js del marco holográfico — se superpone */}
          <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
            <FrameCanvas />
          </div>

          {/* Fondo del panel */}
          <div
            className="relative z-10 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,13,22,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(124,92,252,0.08)',
            }}
          >
            {/* Header del panel estilo terminal */}
            <div
              className="flex items-center gap-2 px-5 py-3 border-b"
              style={{
                borderColor: 'rgba(124,92,252,0.1)',
                background: 'rgba(124,92,252,0.04)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#7c5cfc', boxShadow: '0 0 6px #7c5cfc' }}
              />
              <span
                className="font-mono text-xs tracking-widest uppercase"
                style={{ color: 'rgba(167,139,250,0.5)', fontSize: 10 }}
              >
                PLAYER_AUTH
              </span>
              <div className="ml-auto flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ background: `rgba(124,92,252,${0.2 + i * 0.15})` }}
                  />
                ))}
              </div>
            </div>

            <div className="p-7">
              {/* Subtítulo del form */}
              <div className="mb-7">
                <h2 className="font-display font-bold text-white text-[20px] leading-tight">
                  Welcome back
                </h2>
                <p
                  className="font-mono text-xs mt-0.5"
                  style={{ color: 'rgb(162, 138, 255)', fontSize: 13 }}
                >
                  {'> ENTER CREDENTIALS TO CONTINUE_'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Email */}
                <div className="relative">
                  <label
                    className="block font-mono text-[18px] mb-1.5 uppercase tracking-widest"
                    style={{
                      color:
                        focusedField === 'email'
                          ? 'rgb(132, 106, 209)'
                          : 'rgba(245, 238, 238, 0.94)',
                      fontSize: 10,
                      transition: 'color 0.2s',
                    }}
                  >
                    <span style={{ color: 'rgba(124,92,252,0.7)' }}></span> · Email
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
                            ? 'rgba(124,92,252,0.07)'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${focusedField === 'email' ? 'rgba(124,92,252,0.5)' : 'rgba(255, 247, 247, 0.07)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow:
                          focusedField === 'email'
                            ? '0 0 0 3px rgba(124,92,252,0.08), inset 0 0 20px rgba(124,92,252,0.04)'
                            : 'none',
                        fontSize: 13,
                      }}
                    />
                    {focusedField === 'email' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-1 h-4 rounded-full animate-pulse"
                          style={{ background: '#7c5cfc' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo Password */}
                <div className="relative">
                  <label
                    className="block font-mono text-[18px] mb-1.5 uppercase tracking-widest"
                    style={{
                      color:
                        focusedField === 'password'
                          ? 'rgba(167,139,250,0.9)'
                          : 'rgba(245, 238, 238, 0.94)',
                      fontSize: 10,
                      transition: 'color 0.2s',
                    }}
                  >
                    <span style={{ color: 'rgba(124,92,252,0.7)' }}></span> · Password
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
                            ? 'rgba(124,92,252,0.07)'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${focusedField === 'password' ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow:
                          focusedField === 'password'
                            ? '0 0 0 3px rgba(124,92,252,0.08), inset 0 0 20px rgba(124,92,252,0.04)'
                            : 'none',
                        fontSize: 13,
                        letterSpacing: password ? '0.2em' : 'normal',
                      }}
                    />
                    {focusedField === 'password' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-1 h-4 rounded-full animate-pulse"
                          style={{ background: '#7c5cfc' }}
                        />
                      </div>
                    )}
                  </div>
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

                {/* Botón submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden font-display font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(124,92,252,0.3)'
                      : 'linear-gradient(135deg, #7c5cfc 0%, #6144e0 100%)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 10,
                    padding: '13px',
                    color: 'white',
                    boxShadow: loading
                      ? 'none'
                      : '0 0 20px rgba(124,92,252,0.3), 0 4px 12px rgba(124,92,252,0.2)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {/* Shimmer effect */}
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
                      <span className="font-mono text-xs tracking-widest">AUTHENTICATING...</span>
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      <span>Enter</span>
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
                <div className="h-px flex-1" style={{ background: 'rgba(124,92,252,0.15)' }} />
                <p
                  className="font-mono text-xs"
                  style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                >
                  NEW PLAYER?{' '}
                  <Link
                    to="/signup"
                    className="font-bold transition-all"
                    style={{ color: 'rgba(167,139,250,0.8)' }}
                  >
                    CREATE ACCOUNT
                  </Link>
                </p>
                <div className="h-px flex-1" style={{ background: 'rgba(124,92,252,0.15)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Coordenadas decorativas debajo del panel */}
        <div className="flex justify-between mt-4 px-1">
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(124,92,252,0.25)', fontSize: 9 }}
          >
            SYS::AUTH_MODULE
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: 'rgba(124,92,252,0.25)', fontSize: 9 }}
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
