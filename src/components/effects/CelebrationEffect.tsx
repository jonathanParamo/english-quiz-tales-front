import { useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  score: number
  active: boolean
}

function EncouragementParticles({ active }: { active: boolean }) {
  const mesh = useRef<THREE.Points>(null!)
  const COUNT = 60
  const time = useRef(0)

  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const ph = new Float32Array(COUNT)
    const sp = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = -4 + Math.random() * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2
      ph[i] = Math.random() * Math.PI * 2
      sp[i] = 0.003 + Math.random() * 0.005
    }
    return [pos, ph, sp]
  }, [])

  const colorArr = useMemo(() => {
    const col = new Float32Array(COUNT * 3)
    const palette = [
      new THREE.Color('#a78bfa'), // violeta suave
      new THREE.Color('#818cf8'), // índigo
      new THREE.Color('#c4b5fd'), // lavanda
      new THREE.Color('#f0abfc'), // lila
    ]
    for (let i = 0; i < COUNT; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return col
  }, [])

  useFrame((_, delta) => {
    if (!active) return
    time.current += delta
    const pos = mesh.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += Math.sin(time.current * 0.5 + phases[i]) * 0.008
      pos[i * 3 + 1] += speeds[i]
      if (pos[i * 3 + 1] > 5) {
        pos[i * 3 + 1] = -4.5
        pos[i * 3] = (Math.random() - 0.5) * 8
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
    const mat = mesh.current.material as THREE.PointsMaterial
    mat.opacity = 0.35 + Math.sin(time.current * 1.2) * 0.2
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArr, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function EpicConfetti({ score, active }: Props) {
  const mesh = useRef<THREE.Points>(null!)
  const COUNT = score >= 90 ? 400 : 220

  const palette = useMemo(() => {
    if (score >= 90)
      return [
        '#f59e0b',
        '#fbbf24',
        '#fde68a', // dorado
        '#f472b6',
        '#fb7185', // rosa
        '#a78bfa',
        '#818cf8', // violeta
        '#34d399',
        '#6ee7b7', // menta
      ]
    return [
      '#34d399',
      '#6ee7b7',
      '#a7f3d0', // verde fresco
      '#7c5cfc',
      '#a78bfa', // violeta
      '#38bdf8', // celeste
    ]
  }, [score])

  const [positions, vel, colorArr] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const vel = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      if (score >= 90) {
        const originX = (Math.random() - 0.5) * 3
        const originY = 1 + Math.random() * 2
        pos[i * 3] = originX
        pos[i * 3 + 1] = originY
        pos[i * 3 + 2] = 0
        const angle = Math.random() * Math.PI * 2
        const spd = 0.04 + Math.random() * 0.12
        vel[i * 3] = Math.cos(angle) * spd
        vel[i * 3 + 1] = Math.sin(angle) * spd
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.04
      } else {
        pos[i * 3] = (Math.random() - 0.5) * 10
        pos[i * 3 + 1] = 3 + Math.random() * 4
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2
        vel[i * 3] = (Math.random() - 0.5) * 0.02
        vel[i * 3 + 1] = -(0.02 + Math.random() * 0.04)
        vel[i * 3 + 2] = 0
      }

      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, vel, col]
  }, [score, palette, COUNT])

  useFrame(() => {
    if (!active) return
    const pos = mesh.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += vel[i * 3]
      pos[i * 3 + 1] += vel[i * 3 + 1]
      pos[i * 3 + 2] += vel[i * 3 + 2]
      vel[i * 3 + 1] -= score >= 90 ? 0.0015 : 0.0005
      if (pos[i * 3 + 1] < -5 || Math.abs(pos[i * 3]) > 7) {
        if (score >= 90) {
          pos[i * 3] = (Math.random() - 0.5) * 3
          pos[i * 3 + 1] = 1 + Math.random() * 2
          vel[i * 3] = Math.cos(Math.random() * Math.PI * 2) * (0.04 + Math.random() * 0.1)
          vel[i * 3 + 1] = Math.sin(Math.random() * Math.PI * 2) * (0.04 + Math.random() * 0.1)
        } else {
          pos[i * 3] = (Math.random() - 0.5) * 10
          pos[i * 3 + 1] = 4
          vel[i * 3 + 1] = -(0.02 + Math.random() * 0.04)
        }
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  const size = score >= 90 ? 0.18 : 0.13

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArr, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  )
}

export default function CelebrationEffect({ score, active }: Props) {
  if (!active) return null

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 70 }}>
        {score < 50 ? (
          <EncouragementParticles active={active} />
        ) : (
          <EpicConfetti score={score} active={active} />
        )}
      </Canvas>
    </div>
  )
}
