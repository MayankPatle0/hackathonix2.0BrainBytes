// mobilef/utils/metadataExtractor.js
/**
 * Metadata Extraction using oEmbed APIs
 * Fetches rich metadata from supported platforms
 */

import { supportsOEmbed } from './platformDetector';

// oEmbed API endpoints
const OEMBED_ENDPOINTS = {
  instagram: 'https://graph.facebook.com/v18.0/instagram_oembed',
  youtube: 'https://www.youtube.com/oembed',
  tiktok: 'https://www.tiktok.com/oembed',
  reddit: 'https://www.reddit.com/oembed',
};

/**
 * Extract metadata using oEmbed API
 * @param {string} url - Content URL
 * @param {string} platform - Platform name
 * @returns {Promise<Object|null>} Metadata object or null if failed
 */
export async function extractMetadata(url, platform) {
  if (!supportsOEmbed(platform)) {
    console.log(`${platform} doesn't support oEmbed`);
    return null;
  }
  
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) return null;
  
  try {
    // Instagram requires Facebook token (use public access)
    let fetchURL = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
    
    // Add maxwidth for better thumbnails
    if (platform !== 'instagram') {
      fetchURL += '&maxwidth=640';
    }
    
    const response = await fetch(fetchURL, {
      headers: {
        'User-Agent': 'Nexus Mobile App/1.0'
      }
    });
    
    if (!response.ok) {
      console.warn(`oEmbed API failed for ${platform}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Normalize response across platforms
    return normalizeMetadata(data, platform);
    
  } catch (error) {
    console.warn(`Metadata extraction failed for ${platform}:`, error.message);
    return null;
  }
}

/**
 * Normalize metadata from different platforms
 * @param {Object} data - Raw oEmbed data
 * @param {string} platform - Platform name
 * @returns {Object} Normalized metadata
 */
function normalizeMetadata(data, platform) {
  const normalized = {
    title: data.title || null,
    author: data.author_name || data.provider_name || null,
    authorUrl: data.author_url || null,
    thumbnailUrl: data.thumbnail_url || null,
    thumbnailWidth: data.thumbnail_width || null,
    thumbnailHeight: data.thumbnail_height || null,
    providerName: data.provider_name || platform,
    providerUrl: data.provider_url || null,
    html: data.html || null,
    width: data.width || null,
    height: data.height || null,
  };
  
  // Platform-specific extraction
  switch (platform) {
    case 'youtube':
      // YouTube provides good metadata
      break;
      
    case 'tiktok':
      // TikTok metadata is limited
      break;
      
    case 'instagram':
      // Instagram requires Facebook Graph API token for full data
      // Public oEmbed is limited
      break;
      
    case 'reddit':
      // Reddit provides good metadata
      break;
  }
  
  return normalized;
}

/**
 * Extract metadata with fallback to URL parsing
 * @param {string} url - Content URL
 * @param {string} platform - Platform name
 * @returns {Promise<Object>} Metadata object
 */
export async function extractMetadataWithFallback(url, platform) {
  // Try oEmbed first
  const metadata = await extractMetadata(url, platform);
  
  if (metadata) {
    return metadata;
  }
  
  // Fallback: Parse from URL
  return {
    title: `${platform} content`,
    author: null,
    thumbnailUrl: null,
    fallback: true
  };
}
