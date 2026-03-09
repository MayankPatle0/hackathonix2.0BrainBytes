
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { PropsWithChildren, useEffect, useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Heart, LogOut, LayoutDashboard, Search, Activity, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ChatWidget from "../chat/ChatWidget";

// ... (imports remain)

// Header components removed as per user request to delete "old header"
// Navigation is now handled by individual pages (Index.tsx, Analytics.tsx)

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen bg-background font-['Outfit'] selection:bg-cyan-500/30 overflow-x-hidden transition-colors duration-300">
       {/* Global Background Effects */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Grid Pattern Overlay - Only visible in DARK mode */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light hidden dark:block" />
          <div 
            className="absolute inset-0 opacity-[0.05] hidden dark:block" 
            style={{
                backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                backgroundSize: '4rem 4rem',
                color: 'var(--foreground)' 
            }} 
          />
          
          {/* Light Mode Simple Gradient - Clean & Airy */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-100/50 dark:hidden" />
          
          {/* Floating Orbs - Only visible in DARK mode or very faint in Light */}
          <div className="hidden dark:block">
              {/* Animated Gradient Orb - Primary Focus */}
              <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[80%] h-[60%] rounded-full animate-gradient opacity-20 blur-[150px]" />
              
              {/* Secondary Orbs */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[120px] animate-blob" />
              <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/15 blur-[120px] animate-blob animation-delay-2000" />
              <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] animate-blob animation-delay-4000" />
          </div>
          {/* Light Mode subtle gradients */}
          <div className="block dark:hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-100/40 blur-[120px]" />
          </div>
       </div>

      <main className="relative z-10 container px-4 md:px-8 py-4 pb-24 mx-auto max-w-7xl">
          {children}
      </main>
      <ChatWidget />
    </div>
  );
}
