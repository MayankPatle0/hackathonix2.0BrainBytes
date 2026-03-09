// mobilef/utils/contentEnhancer.js
/**
 * Content Enhancement Utility
 * Enhances shared content with platform detection and metadata
 */

import { detectPlatform, detectContentType } from './platformDetector';
import { extractPrimaryURL, extractURLs, cleanURL } from './urlExtractor';
import { extractMetadataWithFallback } from './metadataExtractor';

/**
 * Enhance shared content with intelligence
 * @param {string} rawText - Raw shared text
 * @param {Object} options - Enhancement options
 * @returns {Promise<Object>} Enhanced content object
 */
export async function enhanceSharedContent(rawText, options = {}) {
  const { fetchMetadata = true } = options;
  
  // Extract URLs from shared text
  const urls = extractURLs(rawText);
  const primaryUrl = extractPrimaryURL(rawText);
  
  // Base content structure
  const enhanced = {
    rawText,
    hasURL: primaryUrl !== null,
    urls,
    timestamp: new Date().toISOString(),
  };
  
  if (!primaryUrl) {
    // No URL found - it's just text/note
    return {
      ...enhanced,
      platform: 'text',
      type: 'note',
      url: null,
      metadata: null,
    };
  }
  
  // Clean URL
  const cleanedUrl = cleanURL(primaryUrl);
  
  // Detect platform and content type
  const platform = detectPlatform(cleanedUrl);
  const type = detectContentType(cleanedUrl, platform);
  
  enhanced.url = cleanedUrl;
  enhanced.platform = platform;
  enhanced.type = type;
  
  // Fetch metadata if requested
  if (fetchMetadata && platform !== 'text' && platform !== 'unknown') {
    try {
      const metadata = await extractMetadataWithFallback(cleanedUrl, platform);
      enhanced.metadata = metadata;
    } catch (error) {
      console.warn('Metadata fetch failed:', error);
      enhanced.metadata = null;
    }
  } else {
    enhanced.metadata = null;
  }
  
  return enhanced;
}

/**
 * Format enhanced content for backend
 * @param {Object} enhanced - Enhanced content object
 * @param {string} userTitle - User-provided title
 * @param {string} userTags - User-provided tags
 * @returns {string} Formatted text for backend
 */
export function formatForBackend(enhanced, userTitle = '', userTags = '') {
  let formatted = '';
  
  // Header with platform info
  formatted += `Platform: ${enhanced.platform}\n`;
  formatted += `Type: ${enhanced.type}\n`;
  formatted += `Captured: ${new Date().toLocaleString()}\n`;
  if (enhanced.url) {
    formatted += `URL: ${enhanced.url}\n`;
  }
  formatted += '\n' + '─'.repeat(50) + '\n\n';
  
  // User-provided title
  if (userTitle) {
    formatted += `📌 TITLE:\n${userTitle}\n\n`;
  }
  
  // Metadata from platform
  if (enhanced.metadata && !enhanced.metadata.fallback) {
    if (enhanced.metadata.title) {
      formatted += `🎬 ORIGINAL TITLE:\n${enhanced.metadata.title}\n\n`;
    }
    
    if (enhanced.metadata.author) {
      formatted += `👤 AUTHOR: ${enhanced.metadata.author}`;
      if (enhanced.metadata.authorUrl) {
        formatted += ` (${enhanced.metadata.authorUrl})`;
      }
      formatted += '\n\n';
    }
    
    if (enhanced.metadata.thumbnailUrl) {
      formatted += `🖼️ THUMBNAIL: ${enhanced.metadata.thumbnailUrl}\n\n`;
    }
  }
  
  // Content
  formatted += `📄 CONTENT:\n${enhanced.rawText}\n\n`;
  
  // Tags
  if (userTags) {
    const tags = userTags.split(',').map(t => t.trim()).filter(t => t);
    if (tags.length > 0) {
      formatted += `🏷️ TAGS: ${tags.join(', ')}\n\n`;
    }
  }
  
  // Additional URLs
  if (enhanced.urls && enhanced.urls.length > 1) {
    formatted += `🔗 ADDITIONAL LINKS:\n`;
    enhanced.urls.slice(1, 5).forEach((url, i) => {
      formatted += `  ${i + 1}. ${url}\n`;
    });
    formatted += '\n';
  }
  
  return formatted;
}

/**
 * Quick content analysis (synchronous, no network)
 * @param {string} rawText - Raw text
 * @returns {Object} Basic analysis
 */
export function quickAnalyze(rawText) {
  const url = extractPrimaryURL(rawText);
  
  if (!url) {
    return {
      platform: 'text',
      type: 'note',
      icon: '📝',
      color: '#a1a1aa'
    };
  }
  
  const platform = detectPlatform(url);
  const type = detectContentType(url, platform);
  
  // Map to UI elements
  const platformIcons = {
    instagram: '📸',
    youtube: '▶️',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼',
    facebook: '👥',
    reddit: '🤖',
    article: '📰',
    text: '📝',
  };
  
  const platformColors = {
    instagram: '#E4405F',
    youtube: '#FF0000',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    facebook: '#1877F2',
    reddit: '#FF4500',
    article: '#06b6d4',
    text: '#a1a1aa',
  };
  
  return {
    platform,
    type,
    icon: platformIcons[platform] || '🔗',
    color: platformColors[platform] || '#06b6d4'
  };
}
