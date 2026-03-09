/**
 * NEXUS UNIFIED DESIGN SYSTEM
 * 
 * This file defines the consistent color palette and design tokens
 * used across ALL platforms: Extension, Frontend (Web), and Mobile
 * 
 * Brand Identity: Purple → Pink → Cyan gradient
 */

export const NEXUS_COLORS = {
  // === BACKGROUNDS ===
  bg: {
    primary: '#09090b',      // Zinc-950 - Main background
    secondary: '#18181b',    // Zinc-900 - Card background
    tertiary: '#27272a',     // Zinc-800 - Elevated cards
  },

  // === BRAND COLORS (Consistent across all platforms) ===
  brand: {
   primary: '#a855f7',      // Purple-500 - Main brand color
    secondary: '#ec4899',    // Pink-500 - Secondary brand
    accent: '#06b6d4',       // Cyan-500 - Call-to-action
  },

  // === TEXT ===
  text: {
    primary: '#fafafa',      // Zinc-50 - Main text
    secondary: '#a1a1aa',    // Zinc-400 - Secondary text
    muted: '#71717a',        // Zinc-500 - Disabled/muted text
    dim: '#52525b',          // Zinc-600 - Very subtle text
  },

  // === BORDERS ===
  border: {
    default: '#27272a',      // Zinc-800 - Standard borders
    focus: '#06b6d4',        // Cyan-500 - Focused elements
    subtle: '#3f3f46',       // Zinc-700 - Very subtle borders
  },

  // === STATUS COLORS ===
  status: {
    success: '#22c55e',      // Green-500
    error: '#ef4444',        // Red-500
    warning: '#f59e0b',      // Amber-500
    info: '#06b6d4',         // Cyan-500
  },

  // === PLATFORM TYPE COLORS ===
  platforms: {
    youtube: '#ef4444',      // Red-500
    twitter: '#1d9bf0',      // Twitter blue
    instagram: '#e4405f',    // Instagram gradient red
    linkedin: '#0a66c2',     // LinkedIn blue
    reddit: '#ff4500',       // Reddit orange
    tiktok: '#000000',       // TikTok black
    github: '#6e5494',       // GitHub purple
    article: '#06b6d4',      // Cyan-500
    text: '#a1a1aa',         // Zinc-400
  },

  // === GRADIENTS ===
  gradients: {
    brand: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',      // Purple to Pink
    brandReverse: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', // Pink to Purple
    action: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',     // Cyan to Blue
    card: 'linear-gradient(to bottom, #18181b, #0f0f10)',             // Subtle dark
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },

  // === SHADOWS ===
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: {
      brand: '0 0 20px rgba(168, 85, 247, 0.3)',      // Purple glow
      action: '0 0 20px rgba(6, 182, 212, 0.3)',      // Cyan glow
      success: '0 0 20px rgba(34, 197, 94, 0.3)',     // Green glow
    }
  }
};

// === SPACING SYSTEM ===
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// === BORDER RADIUS ===
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// === TYPOGRAPHY ===
export const TYPOGRAPHY = {
  fonts: {
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
    mono: '"SF Mono", "Consolas", "Monaco", monospace',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
};

// === HELPER FUNCTIONS ===

/**
 * Get platform color by type
 */
export function getPlatformColor(type: string): string {
  return NEXUS_COLORS.platforms[type as keyof typeof NEXUS_COLORS.platforms] || NEXUS_COLORS.brand.accent;
}

/**
 * Create rgba color from hex
 */
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get gradient CSS
 */
export function getGradient(name: keyof typeof NEXUS_COLORS.gradients): string {
  return NEXUS_COLORS.gradients[name];
}
