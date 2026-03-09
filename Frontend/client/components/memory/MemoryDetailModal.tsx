'use client';

import { MemoryItem } from "@/types/memory";
import { cn } from "@/lib/utils";
import { X, Heart, ExternalLink, Trash2, Calendar, Tag, FileText, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MemoryDetailModalProps {
  memory: MemoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFav?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MemoryDetailModal({
  memory,
  isOpen,
  onClose,
  onToggleFav,
  onDelete,
}: MemoryDetailModalProps) {
  if (!memory) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-card border-border p-0">
        {/* Header with gradient */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-card via-card to-purple-950/20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-sm font-medium uppercase">
              {memory.type}
            </span>
            {memory.emotion && (
              <span className="px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-800/50 text-purple-400 text-sm font-medium">
                {memory.emotion}
              </span>
            )}
          </div>

          {/* Title */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground leading-tight pr-8">
              {memory.title}
            </DialogTitle>
          </DialogHeader>

          {/* Date */}
          <div className="flex items-center gap-2 mt-3 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(memory.timestamp)}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
          {/* Summary Section */}
          {memory.summary && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                <Sparkles className="w-4 h-4" />
                AI Summary
              </div>
              <p className="text-foreground leading-relaxed text-base">
                {memory.summary}
              </p>
            </div>
          )}

          {/* Keywords */}
          {memory.keywords && memory.keywords.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-pink-400 uppercase tracking-wide">
                <Tag className="w-4 h-4" />
                Keywords
              </div>
              <div className="flex flex-wrap gap-2">
                {memory.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-800/50 text-cyan-400 text-sm font-medium"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-background/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFav?.(memory.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                memory.favorite
                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <Heart className={cn("w-4 h-4", memory.favorite && "fill-current")} />
              {memory.favorite ? 'Saved' : 'Save'}
            </button>

            {memory.url && (
              <a
                href={memory.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-cyan-400 border border-border font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Original
              </a>
            )}
          </div>

          <button
            onClick={() => { onDelete?.(memory.id); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/50 font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
