
'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Image as ImageIcon, Smile, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar({
  onResults,
}: {
  onResults: (ids: string[] | null) => void;
}) {
  const [mode, setMode] = useState<"text" | "emotion" | "image">("text");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageKeywords, setImageKeywords] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const emotions = ["Positive", "Informative", "Analytical", "Excited", "Neutral", "Personal"];

  
  // --- Text search logic (UPDATED to handle backend response) ---
  useEffect(() => {
    if (mode !== 'text') return;
    let isStale = false;

    const searchTimeout = setTimeout(async () => {
      const trimmedQuery = query.trim();

      if (trimmedQuery === "") {
        onResults(null);
        return;
      }

      setLoading(true);
      try {
        let resultIds: string[] | null = null;
        let searchError: any = null;

        if (trimmedQuery.includes(' ')) {
          console.log("Multiple words detected, calling backend NLP route...");
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/searchNLPSql`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: trimmedQuery })
            });

            if (!response.ok) {
                // Fallback to simple local search if NLP fails
                 console.warn("NLP Search failed, falling back to local filter");
                 const { data, error } = await supabase
                    .from('retain_auth_memory')
                    .select('id')
                    .or(`metadata->>title.ilike.%${trimmedQuery}%,metadata->>summary.ilike.%${trimmedQuery}%`);
                 
                 if (!error && data) {
                     resultIds = data.map(item => String(item.id));
                 }
            } else {
                const result = await response.json();
                resultIds = result.ids || [];
            }
          } catch (backendError) {
             console.error("Error calling backend NLP search:", backendError);
             // Fallback
             const { data } = await supabase
                .from('retain_auth_memory')
                .select('id')
                .or(`metadata->>title.ilike.%${trimmedQuery}%,metadata->>summary.ilike.%${trimmedQuery}%`);
             if (data) resultIds = data.map(item => String(item.id));
          }

        } else {
          console.log("Single word detected, performing broad metadata search...");
          const q = trimmedQuery.toLowerCase();
          // Broad search across Title, Summary, Keywords (array), Type, and Source URL
          // Note: Keywords is a JSON array, so we check if it contains the tag. Type is a direct string.
          
          // Constructing the OR filter
          // 1. Title or Summary contains query
          // 2. Type equals query (e.g., 'video')
          // 3. Source URL contains query (e.g., 'youtube')
          
          const { data, error } = await supabase
            .from('retain_auth_memory')
            .select('id')
            .or(`metadata->>title.ilike.%${q}%,metadata->>summary.ilike.%${q}%,metadata->>type.ilike.%${q}%,metadata->>source_url.ilike.%${q}%`);
            
          if (error) {
             searchError = error;
          } else {
             resultIds = data ? data.map(item => String(item.id)) : [];
          }
        }

        if (isStale) return;

        if (searchError) {
          console.error("Error during search:", searchError);
          onResults([]);
        } else {
          onResults(resultIds);
        }

      } finally {
        if (!isStale) setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(searchTimeout);
      isStale = true;
    };
  }, [query, mode, onResults]);

  
  async function handleEmotion(emotion: string) {
    setLoading(true);
    try {
        // Direct metadata filter instead of RPC, more reliable for simple containment
        const { data, error } = await supabase
          .from('retain_auth_memory')
          .select('id')
          .contains('metadata', { emotions: [emotion] }); // Checks if emotions array contains the value

        if (error) {
            console.error("Error during emotion search:", error);
            onResults([]);
            return;
        }
        onResults(data.map((item) => String(item.id)));
    } finally {
        setLoading(false);
    }
  }

  async function handleImage(file?: File | null) {
    if (!file) return;
    setLoading(true);
    setImageKeywords([]);
    onResults(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/searchByImage`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const result = await response.json();
      const keywords = result.keywords || [];
      setImageKeywords(keywords);

      if (keywords.length === 0) {
        onResults([]);
        return;
      }

      const searchQuery = keywords.join(' | ');
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('id')
        .textSearch('fts', searchQuery, {
            type: 'websearch',
            config: 'simple'
        });

      if (error) {
        throw error;
      }
      
      const matchingIds = data.map(item => String(item.id));
      onResults(matchingIds);

    } catch (error) {
      console.error("Error during image search:", error);
      onResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar Container - Glassmorphism */}
      <div 
        className={cn(
            "relative flex items-center w-full h-16 rounded-full transition-all duration-500",
            "bg-card/80 backdrop-blur-xl border border-border/50",
            "shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
            isFocused 
                ? "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2),0_4px_30px_rgba(0,0,0,0.15)] ring-2 ring-cyan-500/20" 
                : "hover:border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
        )}
      >
        {/* Animated glow border on focus */}
        {isFocused && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10 animate-pulse" />
        )}

        {/* Search Icon */}
        <div className={cn(
            "pl-5 pr-3 transition-colors duration-300",
            isFocused ? "text-cyan-400" : "text-muted-foreground"
        )}>
            <Search className="w-5 h-5" />
        </div>

        {/* Input Area */}
        <div className="flex-1 h-full">
            {mode === 'text' && (
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search your memories..."
                    className="w-full h-full bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none text-base font-medium"
                />
            )}
             {mode === 'image' && (
                <label className="flex items-center h-full w-full cursor-pointer text-muted-foreground hover:text-foreground text-sm transition-colors">
                   <div className="flex items-center gap-2">
                       <span className="text-cyan-400 font-semibold">📷 Click to upload image</span>
                       {loading && <span className="animate-pulse text-purple-400">Analyzing...</span>}
                   </div>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
                </label>
            )}
            {mode === 'emotion' && (
                <div className="flex items-center h-full w-full text-muted-foreground text-sm">
                    ✨ Select an emotion below...
                </div>
            )}
        </div>

        {/* Mode Toggles (Right Side Pill) - Gradient Active */}
        <div className="mr-2 p-1.5 bg-muted/80 backdrop-blur-sm rounded-full flex items-center gap-1">
            {(['text', 'emotion', 'image'] as const).map((m) => (
                <button
                    key={m}
                    onClick={() => { setMode(m); setQuery(""); setImageKeywords([]); onResults(null); }}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                        mode === m 
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                    )}
                >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
            ))}
        </div>
      </div>

      {/* Emotion Chips */}
      {mode === "emotion" && (
        <div className="flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          {emotions.map((e) => (
            <button
              key={e}
              onClick={() => handleEmotion(e)}
              className="rounded-full bg-zinc-900 border border-zinc-800 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/20"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Image Keywords */}
      {imageKeywords.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {imageKeywords.map(k => (
            <span key={k} className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">#{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}