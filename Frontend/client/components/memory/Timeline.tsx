
import { groupByDate } from "@/lib/search"; 
import { MemoryItem } from "@/types/memory"; 
import MemoryCard from "./MemoryCard";

export default function Timeline({
  items,
  onToggleFav,
  onDelete,
  onEdit
}: {
  items: MemoryItem[];
  onToggleFav?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: MemoryItem) => void;
}) {
  const groups = groupByDate(items);
  const keys = Object.keys(groups)
    .map((k) => new Date(k))
    .sort((a, b) => b.getTime() - a.getTime())
    .map((d) => d.toDateString());
    
  return (
    <div className="space-y-8">
      {keys.map((k) => (
        <section key={k} className="relative pl-4 border-l border-zinc-800 ml-2">
          <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600" />
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 pl-2">
            {k}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups[k].map((m) => (
              <MemoryCard 
                key={m.id} 
                item={m} 
                onToggleFav={onToggleFav} 
                onDelete={onDelete} 
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
