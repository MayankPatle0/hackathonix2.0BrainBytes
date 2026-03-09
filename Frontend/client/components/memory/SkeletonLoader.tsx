
import { cn } from "@/lib/utils";

export function SkeletonCard() {
  return (
    <div className="flex flex-col h-[280px] justify-between overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-lg relative">
      <div className="space-y-4 relative z-10">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-2">
           {/* Platform Badge */}
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
           {/* Heart Icon */}
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        </div>
        
        {/* Main Content */}
        <div className="flex gap-4">
             <div className="space-y-3 flex-1">
                {/* Title */}
                <div className="h-5 w-full animate-pulse rounded bg-muted-foreground/20" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted-foreground/20" />
             </div>
             {/* Thumbnail Placeholder */}
             <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-muted" />
        </div>

        {/* Summary Lines */}
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
        </div>
      </div>

      {/* Footer (Category + Actions) */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 relative z-10">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
            <div className="h-6 w-6 animate-pulse rounded bg-muted" />
            <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
