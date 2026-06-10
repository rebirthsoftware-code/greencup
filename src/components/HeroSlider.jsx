import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import FallingLeaves from './FallingLeaves';
import './HeroSlider.css';

const PlaceholderCup = ({ color }) => {
  const mesh = useRef();
  
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      <ContactShadows position={[0, -0.6, 0]} opacity={0.3} scale={7} blur={3} far={4} color="#598845" />
      
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.5} floatingRange={[-0.1, 0.15]}>
        <mesh ref={mesh} castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 0.9, 3, 32]} />
          <meshPhysicalMaterial 
            color={color} 
            roughness={0.1} 
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.2}
          />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[1.25, 1.2, 0.2, 32]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.9} />
        </mesh>
      </Float>
    </group>
  );
};

const HeroSlider = () => {
  const activeColor = "#598845"; 

  return (
    <div className="hero-section">
      <div className="hero-content relative-z">
        <h1 className="hover-target" data-hover="PURE">Nature's Essence <br/><span className="text-primary">Preserved</span></h1>
        <p>Awwwards premium eco packaging. Explore the flow of sustainability.</p>
        <button className="btn-primary hover-target" data-hover="GO">Explore Collection</button>
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
            <PlaceholderCup color={activeColor} />
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
