
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Environment,
} from "@react-three/drei";
import { useRef } from "react";

function Sculpture() {
  const sculptureRef = useRef();
  const coreRef = useRef();

  useFrame((state, delta) => {
    if (sculptureRef.current) {
      sculptureRef.current.rotation.y += delta * 0.15;
    }

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.25;
      coreRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.25}
      floatIntensity={0.6}
    >
      <group ref={sculptureRef}>
        {/* Main artistic 3D sculpture */}
        <mesh castShadow>
          <torusKnotGeometry args={[1.1, 0.3, 180, 24]} />
          <meshPhysicalMaterial
            color="#8b5cf6"
            metalness={0.85}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Inner holographic sculpture */}
        <mesh ref={coreRef} scale={0.55}>
          <icosahedronGeometry args={[1, 2]} />
          <meshPhysicalMaterial
            color="#22d3ee"
            metalness={0.7}
            roughness={0.1}
            emissive="#0891b2"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Decorative orbit */}
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[1.8, 0.015, 12, 100]} />
          <meshBasicMaterial color="#a78bfa" />
        </mesh>
      </group>
    </Float>
  );
}

function Hero3D() {
  return (
    <div
      className="hero-3d-container"
      role="img"
      aria-label="Interactive rotating purple and cyan 3D sculpture"
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        fallback={<p>3D preview unavailable.</p>}
      >
        <ambientLight intensity={0.9} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={3}
          color="#a78bfa"
        />

        <pointLight
          position={[-4, -2, 3]}
          intensity={30}
          color="#22d3ee"
        />

        <pointLight
          position={[2, 3, -3]}
          intensity={20}
          color="#ec4899"
        />

        <Sculpture />

        <Environment preset="city" />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.5}
          maxDistance={8}
          autoRotate={false}
        />
      </Canvas>

      <p className="hero-3d-hint">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}

export default Hero3D;
