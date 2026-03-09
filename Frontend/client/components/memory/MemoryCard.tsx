
import { MemoryItem } from "@/types/memory";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { jsPDF } from "jspdf"; 
import { MoreVertical, Heart, ExternalLink, Edit2, Trash2, Download, Monitor, Smartphone, Lightbulb, Sparkles, BookOpen, Flame, Rocket } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon mapping for platform types
const platformIcons: Record<string, string> = {
  youtube: "🔴",
  twitter: "🐦",
  linkedin: "💼",
  reddit: "🔶",
  instagram: "📷",
  github: "⚙️",
  article: "📄",
  pdf: "📕",
  text: "📝"
};

// Category icons and colors
const categoryConfig: Record<string, { icon: React.ElementType, color: string, label: string }> = {
  informative: { icon: Lightbulb, color: "text-cyan-400", label: "Informative" },
  insightful: { icon: Sparkles, color: "text-purple-400", label: "Insightful" },
  educational: { icon: BookOpen, color: "text-blue-400", label: "Educational" },
  helpful: { icon: Flame, color: "text-emerald-400", label: "Helpful" },
  motivational: { icon: Rocket, color: "text-pink-400", label: "Motivational" }
};

function TypeBadge({ type }: { type: MemoryItem["type"] }) {
    const emoji = platformIcons[type] || "📄";
    const label = type[0].toUpperCase() + type.slice(1);
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 border border-border">
            <span className="text-sm">{emoji}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}

function EmotionBadge({ emotion }: { emotion?: string }) {
    if (!emotion) return null;
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2.5 py-1 rounded-md border border-cyan-900/50">
            {emotion}
        </span>
    );
}

function CategoryBadge({ category }: { category?: string }) {
    if (!category) return null;
    const config = categoryConfig[category.toLowerCase()] || categoryConfig.informative;
    const Icon = config.icon;
    
    return (
        <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.color)}>
            <Icon className="w-3.5 h-3.5" />
            <span>{config.label}</span>
        </div>
    );
}

function SourceBadge({ source }: { source?: 'M' | 'W' | 'E' }) {
    if (!source) return null;
    const isMobile = source === 'M';
    const Icon = isMobile ? Smartphone : Monitor;
    
    return (
        <div 
            title={isMobile ? 'Captured via Mobile' : 'Captured via Web'}
            className={cn(
                "p-1.5 rounded-full bg-card/80 border border-border",
                isMobile ? "text-purple-400" : "text-cyan-400"
            )}
        >
            <Icon className="w-3 h-3" />
        </div>
    );
}

function getImageForType(type: MemoryItem["type"]) {
    switch (type) {
        case "youtube": return "/images/youtube.png";
        case "linkedin": return "/images/linkedin.png";
        case "twitter": return "/images/twitter.jpeg";
        case "reddit": return "/images/reddit.png";
        case "quora": return "/images/quora.png";
        case "instagram": return "/images/instagram.png";
        case "github": return "/images/github.png";
        default: return "/images/article.jpeg";
    }
}

export default function MemoryCard({
    item,
    onToggleFav,
    onDelete, 
    onEdit,
    onClick
}: {
    item: MemoryItem;
    onToggleFav?: (id: string) => void;
    onDelete?: (id: string) => void; 
    onEdit?: (item: MemoryItem) => void;
    onClick?: (item: MemoryItem) => void;
}) {
    const imageUrl = getImageForType(item.type);
    
    // Determine border gradient (alternating purple-pink and cyan-blue)
    const borderGradients = [
        "from-purple-500 via-pink-500 to-purple-500",
        "from-cyan-500 via-blue-500 to-cyan-500",
        "from-purple-500 via-pink-500 to-purple-500",
    ];
    const gradientIndex = parseInt(item.id.slice(-1), 16) % borderGradients.length;
    const borderGradient = borderGradients[gradientIndex];
    
    // Derive category from emotion or keywords
    const category = item.emotion || (item.keywords?.[0] ? 'informative' : null);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(item.title, 10, 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Summary:", 10, 35);
        const summaryLines = doc.splitTextToSize(item.summary || "No summary available.", 180);
        doc.text(summaryLines, 10, 42);
        doc.save(`${item.title.substring(0, 30)}_summary.pdf`);
    };
    
    const displaySource = item.source === 'M' ? 'M' : 'E';

    return (
        <article 
            onClick={() => onClick?.(item)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card 
                       transition-all duration-500 ease-out cursor-pointer
                       hover:-translate-y-2 hover:scale-[1.02]
                       shadow-lg shadow-black/20
                       hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.3),0_10px_30px_-10px_rgba(6,182,212,0.2)]
                       h-[320px]"
            style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
            }}
        >
            
            {/* Animated Gradient Border */}
            <div className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-br p-[1.5px] opacity-30 group-hover:opacity-100 transition-all duration-500",
                borderGradient
            )}>
                <div className="w-full h-full bg-card rounded-2xl backdrop-blur-sm" /> 
            </div>

            {/* Glassmorphism Overlay - Visible on Hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Shimmer Effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" 
                     style={{ transform: 'skewX(-20deg)' }} 
                />
            </div>

            {/* Content */}
            <div className="relative z-10 p-5 pb-2">
                {/* Header Row */}
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                             <TypeBadge type={item.type} />
                             <SourceBadge source={displaySource} />
                        </div>
                        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground group-hover:text-cyan-400 transition-colors duration-300">
                            {item.title}
                        </h3>
                    </div>
                    
                    {/* Favorite Star - Top Right with pulse animation */}
                    <button
                        onClick={() => onToggleFav?.(item.id)}
                        className={cn(
                            "shrink-0 p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
                            item.favorite 
                                ? "text-pink-500 bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.4)]" 
                                : "text-muted-foreground/60 hover:text-pink-400 hover:bg-pink-500/10"
                        )}
                        title="Toggle Favorite"
                    >
                        <Heart className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            item.favorite && "fill-current animate-pulse"
                        )} />
                    </button>
                </div>
                
                {/* Platform Icon (larger, centered) */}
                {imageUrl && (
                    <div className="mb-3 flex justify-center">
                         <img
                            src={imageUrl}
                            alt=""
                            className="h-16 w-16 rounded-xl object-cover opacity-80 group-hover:opacity-100 transition-opacity ring-2 ring-border"
                            onError={(e) => { e.currentTarget.src = "/images/article.jpeg"; }} 
                        />
                    </div>
                )}

                {/* Summary */}
                {item.summary && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors mb-3">
                        {item.summary}
                    </p>
                )}

                {/* Keywords */}
                {item.keywords && item.keywords.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {item.keywords.slice(0, 4).map((k) => (
                            <span
                                key={k}
                                className="rounded-md px-2 py-1 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-900/50"
                            >
                                {k}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-auto p-5 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <CategoryBadge category={category} />

                    <div className="flex items-center gap-1">
                        {item.url && (
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 text-muted-foreground hover:text-cyan-400 hover:bg-card/50 rounded-lg transition-colors"
                                title="Open Original"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-card/50 rounded-lg transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                                <DropdownMenuItem onClick={() => onEdit?.(item)} className="cursor-pointer hover:bg-muted focus:bg-muted">
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer hover:bg-muted focus:bg-muted">
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete?.(item.id)} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-muted focus:bg-muted focus:text-red-300">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </article>
    );
}
