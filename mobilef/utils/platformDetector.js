// mobilef/utils/platformDetector.js
/**
 * Platform Detection Utility
 * Detects which platform a URL belongs to
 * Reused from Extension with mobile optimizations
 */

/**
 * Detect platform from URL
 * @param {string} url - URL to analyze
 * @returns {string} Platform name or 'article' for default
 */
export function detectPlatform(url) {
  if (!url) return 'unknown';
  
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Social Media Platforms
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      return 'facebook';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }
    if (hostname.includes('reddit.com')) {
      return 'reddit';
    }
    if (hostname.includes('threads.net')) {
      return 'threads';
    }
    
    // Default to article for everything else
    return 'article';
  } catch (error) {
    console.warn('Platform detection failed:', error);
    return 'unknown';
  }
}

/**
 * Detect content type from URL based on platform
 * @param {string} url - URL to analyze
 * @param {string} platform - Platform name
 * @returns {string} Content type
 */
export function detectContentType(url, platform) {
  if (!url) return 'unknown';
  
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    
    switch (platform) {
      case 'instagram':
        if (pathname.includes('/reel/')) return 'reel';
        if (pathname.includes('/p/')) return 'post';
        if (pathname.includes('/stories/')) return 'story';
        if (pathname.includes('/tv/')) return 'igtv';
        return 'post';
        
      case 'youtube':
        if (pathname.includes('/shorts/')) return 'short';
        if (pathname.includes('/watch')) return 'video';
        if (pathname.includes('/live/')) return 'live';
        return 'video';
        
      case 'tiktok':
        return 'video';
        
      case 'twitter':
        if (pathname.includes('/status/')) return 'tweet';
        return 'tweet';
        
      case 'linkedin':
        if (pathname.includes('/pulse/')) return 'article';
        if (pathname.includes('/posts/')) return 'post';
        return 'post';
        
      case 'facebook':
        if (pathname.includes('/videos/')) return 'video';
        if (pathname.includes('/posts/')) return 'post';
        return 'post';
        
      case 'reddit':
        if (pathname.includes('/comments/')) return 'post';
        return 'post';
        
      case 'threads':
        return 'post';
        
      default:
        return 'article';
    }
  } catch (error) {
    console.warn('Content type detection failed:', error);
    return 'unknown';
  }
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID
 */
export function extractYouTubeVideoId(url) {
  try {
    const urlObj = new URL(url);
    
    // Standard watch URL
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    
    // Short URL or /shorts/
    const pathMatch = urlObj.pathname.match(/\/(shorts|embed)\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      return pathMatch[2];
    }
    
    // youtu.be short URL
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract post ID from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Post ID
 */
export function extractInstagramPostId(url) {
  try {
    const match = url.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    return match ? match[2] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if platform supports oEmbed API
 * @param {string} platform - Platform name
 * @returns {boolean} Whether platform supports oEmbed
 */
export function supportsOEmbed(platform) {
  const oEmbedPlatforms = ['instagram', 'youtube', 'tiktok', 'reddit'];
  return oEmbedPlatforms.includes(platform);
}
