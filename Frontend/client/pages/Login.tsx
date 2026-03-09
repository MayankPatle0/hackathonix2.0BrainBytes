
import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! Check your email to confirm.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl z-10">
        
        <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 mb-4 flex items-center justify-center">
                 <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-14 w-14 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                 >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                 </svg>
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Nexus</h2>
            <p className="text-zinc-500 text-sm mt-2 font-medium">Your Second Brain, Evolved</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        
        {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg mb-4 text-sm text-center">{message}</div>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-500 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white transition-all placeholder:text-zinc-700"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white transition-all placeholder:text-zinc-700"
              placeholder={isLoginView ? "••••••••" : "At least 6 characters"}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-cyan-900/20"
        >
          {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError('');
              setMessage('');
            }}
            className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            {isLoginView ? 'New to Nexus? Create Account' : 'Already have an account? Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}
