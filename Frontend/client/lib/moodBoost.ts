import { supabase } from "./supabaseClient";
import { MemoryItem } from "@/types/memory";

/**
 * Transforms database item to MemoryItem
 */
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
    keywords: meta.keywords || [],
    emotion: meta.emotions ? meta.emotions[0] : 'neutral',
    timestamp: meta.timestamp || dbItem.created_at, // Use created_at as fallback
    url: meta.source_url,
    type: deriveTypeFromUrl(meta.source_url),
    favorite: dbItem.favorite,
    imageDataUrl: null,
  };
}

/**
 * Fetches mood-boosting content from Supabase
 * Searches for items with positive keywords: happy, motivational, inspiring, funny
 * @returns Array of MemoryItems that can boost mood
 */
export async function fetchMoodBoostContent(): Promise<MemoryItem[]> {
  try {
    // Define positive emotions (case variations to match database)
    const positiveEmotions = ['Happy', 'Funny', 'Inspiring', 'Motivational', 'Positive', 'Excited', 'Joyful', 
                              'happy', 'funny', 'inspiring', 'motivational', 'positive', 'excited', 'joyful',
                              'HAPPY', 'FUNNY', 'INSPIRING'];
    const positiveKeywords = ['happy', 'motivational', 'inspiring', 'funny', 'uplifting', 'positive', 'joy', 'encouraging', 'motivate', 'laugh', 'smile'];

    console.log('Fetching mood boost content...');
    
    // Strategy 1: Try querying by emotions using .or()
    let emotionData: any[] = [];
    try {
      const emotionConditions = positiveEmotions
        .map(emotion => `metadata->emotions.cs.{"${emotion}"}`)
        .join(',');

      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .or(emotionConditions)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('Emotion query error (trying alternative):', error);
      } else if (data) {
        emotionData = data;
        console.log(`Found ${data.length} items by emotion query`);
      }
    } catch (err) {
      console.warn('Error with emotion query:', err);
    }

    // Strategy 2: Fetch ALL content and filter client-side (fallback)
    let allItems: any[] = [];
    if (emotionData.length === 0) {
      console.log('No emotion matches, fetching all items for client-side filtering...');
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching all items:', error);
      } else if (data) {
        allItems = data;
        console.log(`Fetched ${data.length} items for client-side filtering`);
      }
    }

    // Strategy 3: Also search in keywords using full-text search
    let keywordData: any[] = [];
    try {
      const keywordQuery = positiveKeywords.join(' | ');
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .textSearch('fts', keywordQuery, {
          type: 'websearch',
          config: 'simple'
        })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Keyword search error:', error);
      } else if (data) {
        keywordData = data;
        console.log(`Found ${data.length} items by keyword search`);
      }
    } catch (err) {
      console.warn('Error with keyword search:', err);
    }

    // Combine all results and deduplicate
    const allResults: any[] = [];
    const seenIds = new Set<string>();

    // Add emotion-based results
    emotionData.forEach(item => {
      if (!seenIds.has(String(item.id))) {
        seenIds.add(String(item.id));
        allResults.push(item);
      }
    });

    // Add keyword-based results
    keywordData.forEach(item => {
      if (!seenIds.has(String(item.id))) {
        seenIds.add(String(item.id));
        allResults.push(item);
      }
    });

    // If we have allItems, filter them client-side
    if (allItems.length > 0) {
      allItems.forEach(item => {
        if (seenIds.has(String(item.id))) return;
        
        const meta = item.metadata || {};
        const emotions = meta.emotions || [];
        const keywords = meta.keywords || [];
        const title = (meta.title || '').toLowerCase();
        const summary = (meta.summary || '').toLowerCase();
        
        // Check if item has positive emotion
        const hasPositiveEmotion = emotions.some((em: string) => 
          positiveEmotions.some(pe => em.toLowerCase().includes(pe.toLowerCase()))
        );
        
        // Check if title/summary has positive keywords
        const textContent = `${title} ${summary} ${keywords.join(' ')}`.toLowerCase();
        const hasPositiveKeyword = positiveKeywords.some(kw => textContent.includes(kw));
        
        if (hasPositiveEmotion || hasPositiveKeyword) {
          seenIds.add(String(item.id));
          allResults.push(item);
        }
      });
    }

    console.log(`Total unique positive items found: ${allResults.length}`);

    // Transform to MemoryItems
    const transformed = allResults.map(transformDbItemToMemoryItem);

    // Filter out any items that are explicitly sad/negative
    const filtered = transformed.filter(item => {
      const emotion = item.emotion?.toLowerCase().trim() || '';
      const sadEmotions = ['sad', 'angry', 'depressed', 'negative', 'down', 'unhappy', 'melancholy'];
      return !sadEmotions.some(sad => emotion.includes(sad));
    });

    console.log(`After filtering negatives: ${filtered.length} items`);

    // Sort by relevance (prefer items with multiple positive signals)
    const scored = filtered.map(item => {
      let score = 0;
      const emotionLower = (item.emotion || '').toLowerCase().trim();
      const keywordsLower = (item.keywords || []).join(' ').toLowerCase();
      const titleLower = (item.title || '').toLowerCase();
      const summaryLower = (item.summary || '').toLowerCase();
      const allText = `${titleLower} ${summaryLower} ${keywordsLower}`;

      // Check emotion
      const positiveEmotionMatches = ['happy', 'funny', 'inspiring', 'motivational', 'positive', 'excited', 'joyful'];
      if (positiveEmotionMatches.some(pe => emotionLower.includes(pe))) {
        score += 5; // Higher weight for emotion match
      }

      // Check keywords in content
      positiveKeywords.forEach(keyword => {
        if (allText.includes(keyword)) {
          score += 2;
        }
      });

      return { item, score };
    });

    // Sort by score and return top items
    const final = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(x => x.item);

    console.log(`Returning ${final.length} mood-boosting items`);
    return final;

  } catch (error) {
    console.error('Error in fetchMoodBoostContent:', error);
    return [];
  }
}

