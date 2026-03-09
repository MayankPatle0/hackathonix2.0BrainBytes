'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MemoryItem } from "@/types/memory";
import { fetchMoodBoostContent } from "@/lib/moodBoost";
import Timeline from "@/components/memory/Timeline";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { detectSadMood } from "@/lib/moodDetection";

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
  };
}

export default function TodaysMood() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSadToday, setIsSadToday] = useState(false);
  const [sadCount, setSadCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch all items to check mood
      const { data: allData, error: allError } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error("Error fetching data:", allError);
        setLoading(false);
        return;
      }

      if (allData) {
        const transformedItems = allData.map(transformDbItemToMemoryItem);
        
        // Check if user has 4+ sad items today
        const sad = detectSadMood(transformedItems);
        setIsSadToday(sad);
        
        // Count sad items today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sadEmotions = ['sad', 'depressed', 'down', 'unhappy', 'melancholy', 'gloomy'];
        const sadItemsCount = transformedItems.filter(item => {
          const itemDate = new Date(item.timestamp);
          itemDate.setHours(0, 0, 0, 0);
          const isToday = itemDate.getTime() === today.getTime();
          const emotionLower = (item.emotion || '').toLowerCase().trim();
          const isSad = emotionLower && sadEmotions.some(sad => emotionLower.includes(sad));
          return isToday && isSad;
        }).length;
        
        setSadCount(sadItemsCount);
        
        // Fetch mood-boosting content
        console.log('Fetching mood-boosting content...');
        const boostContent = await fetchMoodBoostContent();
        console.log(`Fetched ${boostContent.length} mood-boosting items`);
        setItems(boostContent);
      }
      
      setLoading(false);
    }
    
    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel('retain_auth_memory_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'retain_auth_memory' },
        async () => {
          // Refetch on changes
          const { data, error } = await supabase
            .from('retain_auth_memory')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            const transformedItems = data.map(transformDbItemToMemoryItem);
            const sad = detectSadMood(transformedItems);
            setIsSadToday(sad);
            console.log('Realtime update - fetching new mood boost content...');
            const boostContent = await fetchMoodBoostContent();
            console.log(`Fetched ${boostContent.length} mood-boosting items after update`);
            setItems(boostContent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) return;
    const newFavoriteStatus = !currentItem.favorite;
    setItems(items.map(item =>
      item.id === id ? { ...item, favorite: newFavoriteStatus } : item
    ));
    const { error } = await supabase
      .from('retain_auth_memory')
      .update({ favorite: newFavoriteStatus })
      .eq('id', id);
    if (error) {
      console.error("Error updating favorite:", error);
      setItems(items.map(item =>
        item.id === id ? { ...item, favorite: !newFavoriteStatus } : item
      ));
    }
  };

  const handleDelete = async (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
    const { error } = await supabase
      .from('retain_auth_memory')
      .delete()
      .eq('id', id);
    if (error) {
      console.error("Error deleting item:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        Loading your mood boost content...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-500" />
              Your Today's Mood
            </h1>
          </div>
        </div>

        {/* Mood Message */}
        {isSadToday && (
          <div className="rounded-2xl border border-pink-700/50 bg-gradient-to-br from-pink-500/10 to-pink-500/10 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                  We noticed you might be feeling down today
                </h2>
                <p className="text-zinc-300 mb-3">
                  You've saved <span className="font-semibold text-pink-400">{sadCount} items</span> with sad emotions today. 
                  That's okay! Here's some content you've saved that might help brighten your mood.
                </p>
                <p className="text-sm text-zinc-400">
                  Remember: It's okay to feel down sometimes. Take care of yourself! 💙
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-zinc-300">
              Mood-Boosting Content
            </h2>
          </div>
          
          {items.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <Heart className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg mb-2">
                No mood-boosting content found at the moment
              </p>
              <p className="text-zinc-500 text-sm">
                Try saving some happy, inspiring, motivational, or funny content!
              </p>
            </div>
          ) : (
            <Timeline
              items={items}
              onToggleFav={toggleFavorite}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </div>
  );
}

