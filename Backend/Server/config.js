// Backend Configuration for Free Tier Deployment
// Handles optional queue, rate limiting, and fallback modes

export const config = {
  // ===== QUEUE CONFIGURATION =====
  // Set to false for free tier without Redis, true if using Upstash
  useQueue: process.env.USE_QUEUE === 'true',
  
  // ===== RATE LIMITING (Adjusted for 30 users) =====
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: process.env.NODE_ENV === 'production' ? 10 : 20,
    // 10 req/min in production = safe for free tier
    // 30 users = ~5 concurrent max
  },
  
  // ===== REDIS CONFIGURATION =====
  redis: {
    url: process.env.REDIS_URL,
    maxRetries: 3,
    retryDelay: 1000,
    // Upstash FREE: 10K commands/day
    enableOfflineFallback: true, // Process without queue if Redis down
  },
  
  // ===== GROQ API LIMITS =====
  groq: {
    maxTokens: 512, // Keep responses concise for free tier
    temperature: 0.5,
    model: 'llama-3.1-8b-instant',
    // Free tier: 30 req/min
  },
  
  // ===== PERFORMANCE TUNING =====
  performance: {
    jobTimeout: 20000, // 20 seconds (reduced for free tier)
    maxRetries: 2, // Fewer retries to save resources
    concurrency: 1, // Process one job at a time on free tier
  },
  
  // ===== MONITORING =====
  monitoring: {
    enableMetrics: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }
};

// Helper function to check if queue is available
export function isQueueAvailable() {
  return config.useQueue && process.env.REDIS_URL;
}

// Get appropriate rate limit based on environment
export function getRateLimit() {
  return config.rateLimit;
}
