
import { LayoutGrid, Network, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  viewMode: 'grid' | 'graph';
  setViewMode: (mode: 'grid' | 'graph') => void;
}

export function MobileNav({ viewMode, setViewMode }: MobileNavProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
        <button
          onClick={() => setViewMode('grid')}
          className={cn(
            "p-3 rounded-xl transition-all duration-300 relative overflow-hidden",
            viewMode === 'grid' 
              ? "bg-cyan-500/20 text-cyan-400" 
              : "text-zinc-500 hover:text-zinc-300 active:scale-95"
          )}
        >
          <LayoutGrid size={24} strokeWidth={viewMode === 'grid' ? 2.5 : 2} />
        </button>

        <button
          onClick={() => setViewMode('graph')}
          className={cn(
            "p-3 rounded-xl transition-all duration-300 relative overflow-hidden",
            viewMode === 'graph' 
              ? "bg-purple-500/20 text-purple-400" 
              : "text-zinc-500 hover:text-zinc-300 active:scale-95"
          )}
        >
          <Network size={24} strokeWidth={viewMode === 'graph' ? 2.5 : 2} />
        </button>
      </div>
    </div>
  );
}
