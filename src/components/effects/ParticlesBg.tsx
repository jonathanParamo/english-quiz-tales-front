import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Sistema 1: Partículas principales con colores variados ──────────────────
function MainParticles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);

    const spd = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const palette = [
      new THREE.Color("#7c5cfc"), // accent morado
      new THREE.Color("#a78bfa"), // glow lavanda
      new THREE.Color("#34d399"), // mint
      new THREE.Color("#38bdf8"), // sky blue
      new THREE.Color("#f59e0b"), // gold (pocas)
    ];

    for (let i = 0; i < count; i++) {
      // Distribuir en una esfera grande para profundidad
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 8;
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 4;

      spd[i] = 0.003 + Math.random() * 0.008;

      // Color aleatorio del palette, más probabilidad de morados
      const colorIdx =
        Math.random() < 0.5
          ? 0
          : Math.random() < 0.4
            ? 1
            : Math.random() < 0.4
              ? 2
              : Math.random() < 0.5
                ? 3
                : 4;
      const c = palette[colorIdx];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      siz[i] = 0.03 + Math.random() * 0.08;
    }
    return [pos, spd, col, siz];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Subir suavemente
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 9) pos[i * 3 + 1] = -9;

      // Ondulación horizontal orgánica
      pos[i * 3 + 0] += Math.sin(t * 0.3 + i * 0.7) * 0.003;
      pos[i * 3 + 2] += Math.cos(t * 0.2 + i * 0.5) * 0.002;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    // Rotación muy suave de todo el sistema
    mesh.current.rotation.y = t * 0.025;
    mesh.current.rotation.x = Math.sin(t * 0.05) * 0.08;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.007}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Sistema 2: Partículas grandes y brillantes (estrellas) ──────────────────
function StarParticles({ count = 40 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
      spd[i] = 0.001 + Math.random() * 0.003;
      off[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, off];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    const mat = mesh.current.material as THREE.PointsMaterial;

    // Parpadeo suave global
    mat.opacity = 0.4 + Math.sin(t * 1.2) * 0.2;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 9) pos[i * 3 + 1] = -9;
      // Pequeño drift horizontal
      pos[i * 3 + 0] += Math.sin(t * 0.15 + offsets[i]) * 0.001;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#ffffff"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Sistema 3: Partículas muy pequeñas tipo polvo/niebla ───────────────────
function DustParticles({ count = 300 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      spd[i] = 0.001 + Math.random() * 0.003;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * 0.6;
      if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -10;
      pos[i * 3 + 0] += Math.sin(t * 0.1 + i) * 0.0008;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = t * 0.01;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.005}
        color="#a78bfa"
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Sistema 4: Líneas de conexión entre puntos cercanos ────────────────────
function HaloParticles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribuir en un círculo/halo
      const angle = (i / count) * Math.PI * 2;
      const radius = 8 + Math.random() * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2; // leve variación vertical
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      spd[i] = 0.001 + Math.random() * 0.002;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Movimiento suave tipo órbita
      const angle = (i / count) * Math.PI * 2 + t * speeds[i];
      const radius = 8 + Math.sin(t * 0.3 + i) * 0.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = t * 0.05; // rotación global lenta
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#ff00ff" // magenta neón
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function ParticlesBg() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: false, alpha: true }}
      >
        {/* Niebla de fondo sutil */}
        <fog attach="fog" args={["#0d0d14", 15, 30]} />

        <DustParticles count={280} />
        <MainParticles count={180} />
        <StarParticles count={35} />
        <HaloParticles />
      </Canvas>
    </div>
  );
}
