import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MemoryItem, Preferences } from "@/types/memory";
import { analyzeMemory } from "@/lib/ai";

const STORAGE_KEY = "mnemo.memories.v1";
const PREFS_KEY = "mnemo.prefs.v1";

interface MemoryContextValue {
  items: MemoryItem[];
  add: (
    item: Omit<
      MemoryItem,
      "id" | "summary" | "keywords" | "emotion" | "embedding"
    >,
  ) => Promise<void>;
  update: (id: string, patch: Partial<MemoryItem>) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  seed: () => void;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MemoryItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemoryItem[]) : [];
  });
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw
      ? (JSON.parse(raw) as Preferences)
      : { localOnly: true, excludedKeywords: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const add: MemoryContextValue["add"] = useCallback(async (item) => {
    const id = crypto.randomUUID();
    const analyzed = await analyzeMemory({ ...item, id });
    setItems((prev) => [{ ...analyzed }, ...prev]);
  }, []);

  const update: MemoryContextValue["update"] = useCallback((id, patch) => {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const remove: MemoryContextValue["remove"] = useCallback((id) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m)),
    );
  }, []);

  const seed = useCallback(() => {
    if (items.length > 0) return;
    const now = Date.now();
    const seeds: Omit<MemoryItem, "id">[] = [
      {
        title: "The Hidden Habits of Genius",
        url: "https://example.com/habits-of-genius",
        timestamp: now - 60 * 60 * 1000,
        type: "article",
        content:
          "A deep dive into the everyday routines that enable creative breakthroughs, from deliberate practice to boredom.",
        tags: ["creativity", "habits"],
      },
      {
        title: "Building Vector Search from Scratch",
        url: "https://example.com/vector-search",
        timestamp: now - 2 * 60 * 60 * 1000,
        type: "article",
        content:
          "Explains embeddings, cosine similarity, and indexing strategies for scalable semantic search.",
        tags: ["ai", "search"],
      },
      {
        title: "Tiny moments of joy",
        timestamp: now - 12 * 60 * 60 * 1000,
        type: "image",
        imageDataUrl: undefined,
        content: "A candid photo of a laughing child with bubbles.",
        tags: ["funny", "joy"],
      },
      {
        title: "Naval on Building Wealth",
        url: "https://example.com/naval-wealth",
        timestamp: now - 24 * 60 * 60 * 1000,
        type: "video",
        content:
          "Key ideas: specific knowledge, accountability, leverage (capital, code, media).",
        tags: ["inspiring", "career"],
      },
      {
        title: "Breathing exercise",
        timestamp: now - 36 * 60 * 60 * 1000,
        type: "note",
        content: "Box breathing 4-4-4-4 for calm focus before deep work.",
        tags: ["calm", "focus"],
      },
      {
        title: "Wildlife in slow motion",
        url: "https://example.com/wildlife",
        timestamp: now - 48 * 60 * 60 * 1000,
        type: "video",
        content: "Awe-inspiring slow-mo shots of birds and waterfalls.",
        tags: ["awe", "nature"],
      },
    ];
    (async () => {
      const analyzed: MemoryItem[] = [];
      for (const s of seeds) {
        const withId = { ...s, id: crypto.randomUUID() } as MemoryItem;
        analyzed.push(await analyzeMemory(withId));
      }
      setItems(analyzed);
    })();
  }, [items.length]);

  const value = useMemo<MemoryContextValue>(
    () => ({
      items,
      add,
      update,
      remove,
      toggleFavorite,
      preferences,
      setPreferences,
      seed,
    }),
    [items, add, update, remove, toggleFavorite, preferences],
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error("useMemory must be used within MemoryProvider");
  return ctx;
}
