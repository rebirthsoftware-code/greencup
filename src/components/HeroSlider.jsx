import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import FallingLeaves from './FallingLeaves';
import SafeBoundary from './SafeBoundary';
import './HeroSlider.css';

useTexture.preload('/cup-body.png');

const CUP_COLOR = '#f3f2ec'; // off-white paper

// A realistic branded paper coffee cup: white printed body + glossy black dome lid.
const PlaceholderCup = () => {
  const cupRef = useRef();

  const bodyTexture = useTexture('/cup-body.png', (loaded) => {
    const tex = Array.isArray(loaded) ? loaded[0] : loaded;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  });

  // Cross-section of a travel dome lid (radius, height), revolved around Y.
  // Gives an overhanging brim that grips the cup, then a shallow dome.
  const lidProfile = useMemo(() => ([
    [1.17, 0.00], // skirt bottom (sits just outside the cup rim)
    [1.30, 0.03], // flare out to the brim
    [1.33, 0.10], // brim outer wall
    [1.33, 0.20],
    [1.27, 0.24], // brim top, turning inward
    [1.14, 0.27], // step up toward the dome
    [1.05, 0.31],
    [0.95, 0.38], // dome shoulder
    [0.78, 0.46],
    [0.55, 0.52],
    [0.30, 0.56],
    [0.00, 0.575], // dome apex
  ].map(([x, y]) => new THREE.Vector2(x, y))), []);

  useFrame((state, delta) => {
    if (cupRef.current) {
      cupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group position={[0, -0.25, 0]}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.7} floatingRange={[-0.08, 0.08]}>
        <group ref={cupRef}>
          {/* Printed paper body — the logo artwork wraps around it */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.15, 0.9, 3, 64, 1, true]} />
            <meshStandardMaterial
              map={bodyTexture}
              roughness={0.9}
              metalness={0}
              envMapIntensity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Recessed bottom */}
          <mesh position={[0, -1.5, 0]} receiveShadow>
            <cylinderGeometry args={[0.88, 0.88, 0.05, 64]} />
            <meshStandardMaterial color={CUP_COLOR} roughness={0.95} metalness={0} />
          </mesh>

          {/* Glossy black dome lid */}
          <mesh position={[0, 1.42, 0]} castShadow>
            <latheGeometry args={[lidProfile, 96]} />
            <meshPhysicalMaterial
              color="#161616"
              roughness={0.22}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.18}
              envMapIntensity={1.25}
              side={THREE.DoubleSide}
            />
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
        <SafeBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.3, 7.5], fov: 42 }}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 9, 6]}
            intensity={2.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-6, 3, -3]} intensity={0.5} color="#dfeccb" />
          {/* Back rim light to define the glossy black lid edge */}
          <directionalLight position={[0, 2, -8]} intensity={0.9} color="#ffffff" />

          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 5, Math.PI / 5]}
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

          <ContactShadows position={[0, -1.78, 0]} opacity={0.4} scale={8} blur={2.6} far={4} color="#1a1a1a" />
          <SafeBoundary>
            <Environment preset="studio" />
          </SafeBoundary>
        </Canvas>
        </SafeBoundary>
      </div>
    </div>
  );
};

export default HeroSlider;
