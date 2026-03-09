
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm Nexus. Ask me about your saved memories." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // Use environment variable for backend URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/ask_nexus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ query: userMsg })
      });

      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer || "Sorry, I couldn't find a specific memory matching that." 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "I'm having trouble connecting to your brain right now. Is the backend running?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button - Positioned LEFT to avoid collision with QuickAdd FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 left-8 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110",
          isOpen ? "bg-zinc-800 text-zinc-400" : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        )}
        aria-label={isOpen ? "Close chat" : "Open AI chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window - Positioned LEFT above chat button */}
      <div className={cn(
        "fixed bottom-24 left-8 z-40 w-[350px] sm:w-[400px] h-[500px] flex flex-col bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-left",
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 pointer-events-none"
      )}>
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Ask Nexus</h3>
          </div>
          <div className="text-xs text-zinc-500">AI Memory Recall</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10",
                msg.role === 'user' ? "bg-zinc-800" : "bg-cyan-500/20"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-300"/> : <Bot className="w-4 h-4 text-cyan-400"/>}
              </div>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" 
                  : "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 text-zinc-200 rounded-tl-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-2 animate-pulse">
               <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400"/>
               </div>
               <div className="px-4 py-2.5 rounded-2xl bg-zinc-800/50 text-zinc-500 text-xs border border-zinc-800 rounded-tl-none flex items-center gap-1">
                  <span>Thinking</span>
                  <span className="animate-bounce delay-0">.</span>
                  <span className="animate-bounce delay-150">.</span>
                  <span className="animate-bounce delay-300">.</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 backdrop-blur-sm">
          <div className="flex gap-2 bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Recall something..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-500"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:hover:bg-cyan-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
