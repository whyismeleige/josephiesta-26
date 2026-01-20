import Link from "next/link";
import { Button } from "@/components/ui/button"; 
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";

// Import the wrapper normally (no 'dynamic' needed here)
import SceneWrapper from "@/components/canvas/SceneWrapper";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-purple-500/30">
      
      {/* --- 3D BACKGROUND LAYER --- */}
      <div className="fixed inset-0 z-0">
         <SceneWrapper />
      </div>

      {/* --- FOREGROUND CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center sm:px-6 lg:px-8">
        
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-purple-200 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
          Coming Soon • 2026
        </div>

        {/* Title */}
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            JOSEPHIESTA
          </span>
          <span className="block text-4xl sm:text-6xl md:text-7xl font-outline-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mt-2">
            2K26
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-lg sm:text-xl text-zinc-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          The Annual Techno-Cultural Fest of St. Joseph's. 
          <br className="hidden sm:block" />
          Where code meets culture and innovation meets rhythm.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200 transition-all active:scale-95">
              Register Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <Link href="/events">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-zinc-800 bg-black/50 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all active:scale-95">
              Explore Events <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </Link>

        </div>

        {/* Footer */}
        <div className="mt-20 flex items-center gap-6 text-sm text-zinc-500 animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center gap-2">
             <CalendarDays className="h-4 w-4" />
             <span>February 2026</span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div>King Koti, Hyderabad</div>
        </div>

      </div>
    </main>
  );
}