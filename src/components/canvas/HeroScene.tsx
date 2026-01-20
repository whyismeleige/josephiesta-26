"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";
// @ts-ignore
import * as random from "maath/random/dist/maath-random.esm";

function ParticleRing(props: any) {
  const ref = useRef<any>();
  
  // 1. FIXED: Changed size to 6000 (divisible by 3) to prevent incomplete points
  const [sphere] = useState(() => {
    // Generate points on a sphere
    const data = random.inSphere(new Float32Array(6000), { radius: 1.2 });
    
    // Safety Check: Filter out any NaNs if they occur
    for (let i = 0; i < data.length; i++) {
        if (isNaN(data[i])) data[i] = 0; 
    }
    
    return data;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#a855f7" // Purple-500 to match your theme
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleRing />
        <Preload all />
      </Canvas>
    </div>
  );
}