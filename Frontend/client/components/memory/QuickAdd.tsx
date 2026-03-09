
'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { addMemoryWithQueue } from "@/services/api"; // Use the robust queue service
import { useAuth } from "@/context/AuthContext"; // Ensure we have auth token
import { triggerConfetti } from "@/lib/confetti"; // 🎉 Celebration effect

export default function QuickAdd({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(""); // For detailed status messages
    const [error, setError] = useState<string | null>(null);
    const { session } = useAuth();

    async function onAdd() {
        setError(null);
        if (!title.trim() && !content.trim()) {
            setError("Please enter a title or some content.");
            return;
        }
        
        if (!session?.access_token) {
            setError("You must be logged in to save memories.");
            return;
        }

        setLoading(true);
        setStatus("Sending to Nexus...");
        
        try {
            let textForAI = `Title: ${title}\n`;
            if (content.startsWith('http://') || content.startsWith('https://')) {
                textForAI += `URL: ${content}\n\n`;
            } else {
                textForAI += `\n${content}`;
            }

            // Call the queue-aware service
            await addMemoryWithQueue(
                textForAI, 
                session.access_token, 
                (jobState) => {
                    if (jobState === 'queued') setStatus("Queued for AI...");
                    else if (jobState === 'active' || jobState === 'processing') setStatus("AI Analyzing...");
                    else if (jobState === 'completed') setStatus("Finalizing...");
                }
            );
            
            // 🎉 Success - Trigger confetti celebration!
            setTitle("");
            setContent("");
            setStatus("✨ Memory Saved!");
            triggerConfetti(); // Launch confetti!
            setTimeout(() => onClose(), 800); // Slightly longer delay to enjoy confetti

        } catch (err: any) {
            console.error("Failed to add memory:", err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium text-zinc-400">
                    Title
                </label>
                <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's this about?"
                    className="h-10 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
            </div>
            <div className="grid gap-2">
                <label htmlFor="content" className="text-sm font-medium text-zinc-400">
                    Content or URL
                </label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste a URL, or write a quick note..."
                    rows={4}
                    className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
            </div>
            
            {/* AI Auto-generate info box */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="mb-3 text-sm font-medium text-zinc-300">
                    AI will auto-generate:
                </p>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
                        Keywords
                    </span>
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                        Emotions
                    </span>
                    <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs text-pink-300">
                        Summary
                    </span>
                </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                    onClick={onClose}
                    className={cn(
                        "rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700",
                        loading && "opacity-50"
                    )}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={onAdd}
                    className={cn(
                        "rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 flex items-center justify-center",
                        loading && "opacity-90 cursor-wait"
                    )}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {status || "Saving..."}
                        </span>
                    ) : "Save Memory"}
                </button>
            </div>
        </div>
    );
}
