
import { Sparkles, Keyboard } from "lucide-react";

export function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-700">
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        {/* Pulsing ring */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 blur-md" />
        
        <div className="relative h-28 w-28 rounded-2xl bg-gradient-to-br from-card to-background border border-border flex items-center justify-center shadow-2xl">
           <Sparkles className="h-12 w-12 text-cyan-400 animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
        Your Memory Bank is Empty
      </h3>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Start building your second brain. Capture ideas, articles, and insights to recall them later with AI-powered search.
      </p>

      <button 
        onClick={onAction}
        className="group relative px-8 py-4 rounded-full font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-90 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10 flex items-center gap-2 text-lg">
            ✨ Create First Memory
        </span>
      </button>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60">
        <Keyboard className="h-3 w-3" />
        <span>Pro tip: Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">n</kbd>
        <span>to add a memory anytime</span>
      </div>
    </div>
  );
}
