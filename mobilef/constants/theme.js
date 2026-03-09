/**
 * NEXUS MOBILE THEME
 * Unified with Web and Extension design system
 * Brand: Purple → Pink → Cyan
 */

export const theme = {
  colors: {
    // === BACKGROUNDS ===
    background: '#1a0b2e',      // Deep Purple-Black - Main background
    card: '#2a1a4a',            // Dark Purple - Card background
    cardHighlight: '#3a2a5a',   // Lighter Purple - Borders & elevated elements
    
    // === BRAND IDENTITY ===
    primary: '#06B6D4',         // Cyan-500 - Primary Brand/Action
    secondary: '#A855F7',       // Purple-500 - Secondary Brand
    accent: '#EC4899',          // Pink-500 - Accent similar to logo
    
    action: '#06B6D4',          // Cyan-500 - Main Actions
    danger: '#EF4444',          // Red-500 - Destructive
    success: '#10B981',         // Emerald-500 - Success
    
    // === TEXT ===
    textPrimary: '#F8FAFC',     // Slate-50 - Main text
    textSecondary: '#94A3B8',   // Slate-400 - Secondary text
    textMuted: '#64748B',       // Slate-500 - Muted text
    
    // === GRADIENTS ===
    gradientCard: ['#2a1a4a', '#1a0b2e'],              // Subtle dark gradient
    gradientBrand: ['#06B6D4', '#3B82F6'],             // Cyan to Blue (Primary)
    gradientAccent: ['#A855F7', '#EC4899'],            // Purple to Pink (Secondary)
  },
  
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32
  },
  
  borderRadius: {
    m: 12,
    l: 16,
    full: 9999
  }
};
