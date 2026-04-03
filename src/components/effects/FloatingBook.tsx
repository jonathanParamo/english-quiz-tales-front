import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface BookProps {
  color: string;
  onClick: () => void;
}

function Book({ color, onClick }: BookProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotación y flotación
    mesh.current.rotation.y += hovered ? 0.03 : 0.005;
    mesh.current.position.y = Math.sin(t * 1.2) * 0.12;
    mesh.current.scale.setScalar(hovered ? 1.12 : 1);

    // Glow animado
    glow.current.scale.setScalar(hovered ? 1.4 : 1.25);
  });

  return (
    <>
      {/* Glow detrás */}
      <mesh ref={glow} position={[0, 0, -0.15]}>
        <planeGeometry args={[1.8, 2.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* Libro */}
      <RoundedBox
        ref={mesh}
        args={[1.2, 1.6, 0.25]}
        radius={0.08}
        smoothness={6}
        onClick={onClick}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.3}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.15}
        />
      </RoundedBox>
    </>
  );
}

interface FloatingBookProps {
  color?: string;
  onClick: () => void;
  size?: "sm" | "md";
}

const COLORS = [
  "#7c5cfc",
  "#34d399",
  "#f59e0b",
  "#f43f5e",
  "#38bdf8",
  "#a78bfa",
];
let colorIdx = 0;

export default function FloatingBook({
  color,
  onClick,
  size = "md",
}: FloatingBookProps) {
  const bookColor = color ?? COLORS[colorIdx++ % COLORS.length];
  const h = size === "sm" ? 80 : 110;

  return (
    <div style={{ width: "100%", height: h }}>
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-3, 3, 3]} color="#7c5cfc" intensity={0.8} />
        <pointLight position={[3, -2, 2]} color="#34d399" intensity={0.6} />
        <Book color={bookColor} onClick={onClick} />
      </Canvas>
    </div>
  );
}
