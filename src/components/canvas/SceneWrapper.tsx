"use client";

import dynamic from "next/dynamic";

// We move the dynamic import here
const HeroScene = dynamic(() => import("@/components/canvas/HeroScene"), {
  ssr: false, // This works because we are inside a "use client" component now
  loading: () => <div className="absolute inset-0 bg-black/90 z-0" />,
});

export default function SceneWrapper() {
  return <HeroScene />;
}