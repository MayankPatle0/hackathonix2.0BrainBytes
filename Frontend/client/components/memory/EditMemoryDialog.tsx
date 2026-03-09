
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MemoryItem } from "@/types/memory";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface EditMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MemoryItem | null;
  onSuccess: () => void;
}

export function EditMemoryDialog({ open, onOpenChange, item, onSuccess }: EditMemoryDialogProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setSummary(item.summary || "");
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('retain_auth_memory')
        .update({ 
            metadata: {
                ...item, // Keep existing metadata fields (like keywords, emotion)
                title, 
                summary 
            }
        })
        .eq('id', item.id);

      if (error) throw error;
      
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update memory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-cyan-400">Edit Memory</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-zinc-400">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-cyan-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary" className="text-zinc-400">Summary / Content</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[150px] focus-visible:ring-cyan-500 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-100">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
