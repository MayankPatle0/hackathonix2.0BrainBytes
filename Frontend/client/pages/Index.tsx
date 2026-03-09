
'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MemoryItem } from "@/types/memory";
import SearchBar from "@/components/memory/SearchBar";
import MemoryCard from "@/components/memory/MemoryCard";
import KnowledgeGraph from "@/components/memory/KnowledgeGraph";  
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { EmptyState } from "@/components/memory/EmptyState";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, X } from "lucide-react";

import { MoodPopup } from "@/components/memory/MoodPopup";
import { detectSadMood } from "@/lib/moodDetection";
import { fetchMoodBoostContent } from "@/lib/moodBoost";
import { MoodBoostPopup } from "@/components/memory/MoodBoostPopup"; 
import { EditMemoryDialog } from "@/components/memory/EditMemoryDialog";
import { SkeletonGrid } from "@/components/memory/SkeletonLoader";
import QuickAdd from "@/components/memory/QuickAdd";
import MemoryDetailModal from "@/components/memory/MemoryDetailModal";

// --- Data Transformation Helper ---
function transformDbItemToMemoryItem(dbItem: any): MemoryItem {
  const meta = dbItem.metadata;
  function deriveTypeFromUrl(url: string | null) {
    if (!url) return 'text';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('x.com')) return 'twitter';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('quora.com')) return 'quora';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('github.com')) return 'github';
    if (url.endsWith('.pdf')) return 'pdf';
    return 'article';
  }
  return {
    id: String(dbItem.id),
    title: meta.title,
    summary: meta.summary,
    keywords: meta.keywords,
    emotion: meta.emotions ? meta.emotions[0] : 'neutral',
    timestamp: meta.timestamp || dbItem.created_at,
    url: meta.source_url,
    type: deriveTypeFromUrl(meta.source_url),
    favorite: dbItem.favorite,
    imageDataUrl: null,
    source: meta.source || 'W', 
  };
}

export default function Index() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'recent' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid'); 

  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodBoostPopup, setShowMoodBoostPopup] = useState(false);
  const [moodBoostItems, setMoodBoostItems] = useState<MemoryItem[]>([]);
  const [checkedMoodToday, setCheckedMoodToday] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null); // For detail modal
  
  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          searchInput?.focus();
          break;
        case 'n':
          e.preventDefault();
          setShowQuickAdd(true);
          break;
        case 'Escape':
          setShowQuickAdd(false);
          setShowMoodPopup(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const [editItem, setEditItem] = useState<MemoryItem | null>(null);
  
  const { session } = useAuth(); 

  const checkMoodAndBoost = useCallback(async (currentItems: MemoryItem[]) => {
    const todayKey = `moodChecked_${new Date().toDateString()}`;
    if (sessionStorage.getItem(todayKey)) return;
    const isSad = detectSadMood(currentItems);
    if (isSad) {
      const boostContent = await fetchMoodBoostContent();
      setMoodBoostItems(boostContent);
      setShowMoodBoostPopup(true);
      sessionStorage.setItem(todayKey, 'true');
    }
  }, []);

  const fetchData = useCallback(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching data:", error);
      } else if (data) {
        const transformedItems = data.map(transformDbItemToMemoryItem);
        setItems(transformedItems);
        if (!checkedMoodToday) {
          checkMoodAndBoost(transformedItems);
          setCheckedMoodToday(true);
        }
      }
      setLoading(false);
  }, [checkMoodAndBoost, checkedMoodToday]);

  useEffect(() => {
    fetchData();
    if (!sessionStorage.getItem('moodPopupShown')) {
      setShowMoodPopup(true);
      sessionStorage.setItem('moodPopupShown', 'true');
    }
    const channel = supabase
      .channel('retain_auth_memory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retain_auth_memory' }, async () => {
          fetchData(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]); 

  const toggleFavorite = async (id: string) => {
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) return;
    const newFavoriteStatus = !currentItem.favorite;
    setItems(items.map(item => item.id === id ? { ...item, favorite: newFavoriteStatus } : item));
    await supabase.from('retain_auth_memory').update({ favorite: newFavoriteStatus }).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    setItems(currentItems => currentItems.filter(item => item.id !== id));
    await supabase.from('retain_auth_memory').delete().eq('id', id);
  };

  const handleEdit = (item: MemoryItem) => {
    setEditItem(item);
  };

  const onEditSuccess = () => {
    fetchData(); 
  };

  const baseList = useMemo(() => {
    if (filterMode === 'recent') return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filterMode === 'favorites') return items.filter((m) => m.favorite);
    return items;
  }, [items, filterMode]);

  const searchedList = useMemo(() => {
    if (filteredIds === null) return baseList;
    const searchIdSet = new Set(filteredIds);
    return baseList.filter((item) => searchIdSet.has(item.id));
  }, [baseList, filteredIds]);
  
  const itemsToDisplay = useMemo(() => {
    if (selectedMood === null) return searchedList;
    return searchedList.filter(item => (item.emotion || 'neutral').toLowerCase() === selectedMood.toLowerCase());
  }, [searchedList, selectedMood]);

  const handleSearchResults = useCallback((ids: string[] | null) => { setFilteredIds(ids); }, []);

  return (
    <TooltipProvider>
      <MoodPopup open={showMoodPopup} onOpenChange={setShowMoodPopup} onSelectMood={(m) => {setSelectedMood(m); setShowMoodPopup(false);}} />
      <MoodBoostPopup open={showMoodBoostPopup} onOpenChange={setShowMoodBoostPopup} boostItems={moodBoostItems} />
      
      <EditMemoryDialog 
        open={!!editItem} 
        onOpenChange={(open) => !open && setEditItem(null)}
        item={editItem}
        onSuccess={onEditSuccess}
      />

      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          
          {/* 1. Header with View Toggles */}
          <Header viewMode={viewMode} setViewMode={setViewMode} />

          {/* 2. Main Search Bar */}
          <div className="mb-8">
             <SearchBar onResults={handleSearchResults} />
          </div>

          {/* 3. Filters Row */}
          {viewMode === 'grid' && (
              <div className="flex items-center gap-3 mb-8">
                  <button 
                    onClick={() => setFilterMode('all')} 
                    className={cn(
                        "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95", 
                        filterMode === 'all' 
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_4px_20px_rgba(6,182,212,0.4)]" 
                            : "bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-cyan-500/30 hover:shadow-lg"
                    )}
                  >
                        All <span className={cn(
                            "ml-1.5 text-xs px-2 py-0.5 rounded-full",
                            filterMode === 'all' ? "bg-white/20" : "bg-muted"
                        )}>{items.length}</span>
                  </button>
                  <button 
                    onClick={() => setFilterMode('recent')} 
                    className={cn(
                        "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95", 
                        filterMode === 'recent' 
                            ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(168,85,247,0.4)]" 
                            : "bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-purple-500/30 hover:shadow-lg"
                    )}
                  >
                      🕐 Recent
                  </button>
                  <button 
                    onClick={() => setFilterMode('favorites')} 
                    className={cn(
                        "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95", 
                        filterMode === 'favorites' 
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_4px_20px_rgba(236,72,153,0.4)]" 
                            : "bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-pink-500/30 hover:shadow-lg"
                    )}
                  >
                      Favorites
                  </button>
                  
                  {selectedMood && (
                      <button onClick={() => setSelectedMood(null)} className="ml-auto flex items-center gap-1 rounded-full bg-pink-500/10 px-4 py-2 text-sm text-pink-500 border border-pink-500/20">
                          {selectedMood} <X size={14}/>
                      </button>
                  )}
              </div>
          )}

          {/* 4. Content Area */}
          <div className="space-y-6">
            
            {/* View: Grid */}
            {viewMode === 'grid' && (
                <>
                    {loading ? (
                        <SkeletonGrid />
                    ) : itemsToDisplay.length === 0 ? (
                        <EmptyState onAction={() => setShowQuickAdd(true)} />
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {itemsToDisplay.map((item, index) => (
                               <div 
                                 key={item.id} 
                                 className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards"
                                 style={{ animationDelay: `${index * 50}ms` }}
                               >
                                   <MemoryCard 
                                      item={item} 
                                      onToggleFav={toggleFavorite} 
                                      onDelete={handleDelete}
                                      onEdit={handleEdit}
                                      onClick={(item) => setSelectedMemory(item)}
                                    />
                               </div>
                           ))}
                       </div>
                    )}
                </>
            )}

            {/* View: Graph */}
            {viewMode === 'graph' && (
                <div className="animate-in fade-in duration-500">
                    <KnowledgeGraph items={items} onNodeClick={handleEdit} />
                </div>
            )}

          </div>
        </div>

        {/* Quick Add FAB - Premium Glow */}
        <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowQuickAdd(true)} 
                className="fixed bottom-8 right-8 z-50 flex h-18 w-18 items-center justify-center rounded-full 
                           bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 
                           text-white 
                           shadow-[0_0_40px_rgba(236,72,153,0.5),0_0_80px_rgba(168,85,247,0.3)]
                           hover:shadow-[0_0_60px_rgba(236,72,153,0.7),0_0_100px_rgba(168,85,247,0.5)]
                           hover:scale-110 active:scale-95
                           transition-all duration-300 ease-out
                           animate-glow-pulse"
                style={{ width: '72px', height: '72px' }}
                aria-label="Add new memory"
              >
                <Plus className="h-8 w-8 drop-shadow-lg" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-card border-border text-foreground mr-2 shadow-xl"><p>Add Memory (n)</p></TooltipContent>
          </Tooltip>
          <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
            <DialogHeader><DialogTitle>Capture Memory</DialogTitle></DialogHeader>
            <QuickAdd onClose={() => setShowQuickAdd(false)} />
          </DialogContent>
        </Dialog>

        {/* Mobile Navigation Bar */}
        <MobileNav viewMode={viewMode} setViewMode={setViewMode} />

        {/* Memory Detail Modal */}
        <MemoryDetailModal
          memory={selectedMemory}
          isOpen={selectedMemory !== null}
          onClose={() => setSelectedMemory(null)}
          onToggleFav={toggleFavorite}
          onDelete={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}
