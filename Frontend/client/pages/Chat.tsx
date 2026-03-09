import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
      { role: 'ai', text: "Hi! I'm Nexus. Ask me anything about what you've saved." }
  ]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if(!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
        // Call backend NLP endpoint (Mocking RAG)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/searchNLPSql`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ query: userMsg })
        });
        
        const data = await response.json();
        const count = data.ids ? data.ids.length : 0;
        
        let reply = "";
        if (count > 0) {
            reply = `I found ${count} relevant memories in your Nexus. I've highlighted them on your dashboard.`;
        } else {
            reply = "I searched your Nexus but couldn't find a direct match.";
        }

        setTimeout(() => {
             setMessages(prev => [...prev, { role: 'ai', text: reply }]);
             setLoading(false);
        }, 1000);

    } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I had trouble connecting to your brain." }]);
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-cyan-400" />
        <h2 className="font-semibold text-zinc-100">Ask Nexus</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-cyan-600/20'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-300"/> : <Bot className="w-4 h-4 text-cyan-400"/>}
                </div>
                <div className={`p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-zinc-700 text-white rounded-tr-none' : 'bg-zinc-800/50 text-zinc-200 border border-zinc-800 rounded-tl-none'}`}>
                    {msg.text}
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-400"/>
                 </div>
                 <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-800 rounded-tl-none text-zinc-400 text-sm italic">
                    Thinking...
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex gap-2">
            <input 
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500"
                placeholder="Ask your second brain..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
}