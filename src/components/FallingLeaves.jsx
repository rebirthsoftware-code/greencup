import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export const FallingLeaves = ({ count = 30 }) => {
  const leafTexture = useTexture('/leaf.png');
  
  // Use a simple plane geometry for the image texture
  const leafGeometry = useMemo(() => {
    // Increase segments slightly to allow some vertex displacement if we want to curve it later, 
    // but 1x1 is fine for a flat leaf.
    return new THREE.PlaneGeometry(1, 1);
  }, []);

  const leaves = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 15, 
        (Math.random() - 0.5) * 10 + 5, // Start somewhat high
        (Math.random() - 0.5) * 10
      ],
      rotation: [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ],
      scale: Math.random() * 0.8 + 0.4, // Adjust scale for the plane
      rotationSpeed: [
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ],
      fallSpeed: Math.random() * 0.5 + 0.2
    }));
  }, [count]);

  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;

    // Animate each leaf's fall and rotation
    groupRef.current.children.forEach((leaf, i) => {
      const data = leaves[i];
      // Fall down
      leaf.position.y -= data.fallSpeed * delta;
      
      // Complex sway (X and Z axis)
      const swayX = Math.sin(time * 0.5 + i * 2.5) * 0.03;
      const swayZ = Math.cos(time * 0.4 + i * 1.5) * 0.02;
      
      leaf.position.x += swayX;
      leaf.position.z += swayZ;
      
      // Rotate: aerodynamic rotation where it tilts into the sway direction
      // Plus its own base rotation
      leaf.rotation.x += data.rotationSpeed[0] * delta;
      leaf.rotation.y += data.rotationSpeed[1] * delta + (swayX * 0.1);
      leaf.rotation.z += data.rotationSpeed[2] * delta + (swayZ * 0.1);

      // Reset to top if it falls too low
      if (leaf.position.y < -5) {
        leaf.position.y = 8;
        leaf.position.x = (Math.random() - 0.5) * 15;
        leaf.position.z = (Math.random() - 0.5) * 10;
      }
    });
  });

  return (
    <Instances 
      ref={groupRef}
      geometry={leafGeometry} 
      limit={count} 
      castShadow 
      receiveShadow
    >
      <meshStandardMaterial 
        map={leafTexture}
        transparent={true}
        alphaTest={0.1}
        roughness={0.6}
        side={THREE.DoubleSide} 
      />
      {leaves.map((data, i) => (
        <Instance 
          key={i} 
          position={data.position} 
          rotation={data.rotation} 
          scale={data.scale} 
        />
      ))}
    </Instances>
  );
};

// Preload the texture to avoid suspense issues if possible
useTexture.preload('/leaf.png');

export default FallingLeaves;

