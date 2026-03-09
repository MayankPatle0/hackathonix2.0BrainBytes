
export type MemoryType = "article" | "video" | "image" | "note";

export type Emotion =
  | "funny"
  | "inspiring"
  | "sad"
  | "angry"
  | "calm"
  | "awe"
  | "neutral";

export interface MemoryItem {
  id: string;
  title: string;
  summary?: string;
  keywords?: string[];
  emotion?: string;
  timestamp: string;
  url?: string;
  type: string;
  favorite: boolean;
  imageDataUrl?: string | null;
  source?: 'M' | 'W'; // Added source tracking
}

export interface Preferences {
  localOnly: boolean;
  excludedKeywords: string[];
}
