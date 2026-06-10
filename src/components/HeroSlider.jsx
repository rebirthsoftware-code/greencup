import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import FallingLeaves from './FallingLeaves';
import './HeroSlider.css';

useTexture.preload('/cup-body.png');

const LID_COLOR = '#e7d9c1';

// Branded paper coffee cup ("THE TiOS") with a domed sipper lid.
const PlaceholderCup = () => {
  const cupRef = useRef();
  const bodyTexture = useTexture('/cup-body.png', (loaded) => {
    const tex = Array.isArray(loaded) ? loaded[0] : loaded;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  });

  useFrame((state, delta) => {
    if (cupRef.current) {
      cupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      <ContactShadows position={[0, -0.6, 0]} opacity={0.3} scale={7} blur={3} far={4} color="#598845" />

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.5} floatingRange={[-0.1, 0.15]}>
        <group ref={cupRef}>
          {/* Printed paper body — the artwork is wrapped around it */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.2, 0.86, 3, 64, 1, true]} />
            <meshStandardMaterial map={bodyTexture} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
          </mesh>

          {/* Bottom base */}
          <mesh position={[0, -1.5, 0]} receiveShadow>
            <cylinderGeometry args={[0.86, 0.86, 0.06, 64]} />
            <meshStandardMaterial color={LID_COLOR} roughness={0.9} />
          </mesh>

          {/* Lid rim that grips the cup */}
          <mesh position={[0, 1.62, 0]} castShadow>
            <cylinderGeometry args={[1.3, 1.22, 0.34, 64]} />
            <meshStandardMaterial color={LID_COLOR} roughness={0.55} metalness={0} />
          </mesh>

          {/* Domed lid top */}
          <mesh position={[0, 1.74, 0]} scale={[1, 0.42, 1]} castShadow>
            <sphereGeometry args={[1.24, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={LID_COLOR} roughness={0.5} metalness={0} />
          </mesh>

          {/* Raised drinking mouthpiece */}
          <mesh position={[0.5, 1.9, 0]} rotation={[0, 0, -0.18]} castShadow>
            <cylinderGeometry args={[0.24, 0.32, 0.18, 24]} />
            <meshStandardMaterial color={LID_COLOR} roughness={0.5} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

const HeroSlider = () => {
  return (
    <div className="hero-section">
      <div className="hero-content relative-z">
        <h1 className="hover-target" data-hover="SAF">Doğanın Özü <br/><span className="text-primary">Korunmuş</span></h1>
        <p>Awwwards ödüllü premium eko ambalaj. Sürdürülebilirliğin akışını keşfedin.</p>
        <button className="btn-primary hover-target" data-hover="GİT">Koleksiyonu Keşfet</button>
      </div>

      <div className="canvas-wrapper">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow shadow-mapSize={512} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#CDE0B2" />

          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            <Suspense fallback={null}>
              <PlaceholderCup />
            </Suspense>
            <Suspense fallback={null}>
              <FallingLeaves count={20} />
            </Suspense>
            <Sparkles count={50} scale={10} size={4} speed={0.4} opacity={0.6} color="#92B478" />
          </PresentationControls>

          <Environment preset="apartment" />
        </Canvas>
      </div>
    </div>
  );
};

export default HeroSlider;
