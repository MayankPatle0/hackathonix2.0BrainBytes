// mobilef/utils/urlExtractor.js
/**
 * URL Extraction Utilities
 */

/**
 * Extract all URLs from text
 * @param {string} text - Text to search for URLs
 * @returns {Array<string>} Array of URLs found
 */
export function extractURLs(text) {
  if (!text) return [];
  
  // Enhanced URL regex that handles various formats
  const urlRegex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))/gi;
  
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Extract primary URL from text (first URL found)
 * @param {string} text - Text to search
 * @returns {string|null} Primary URL or null
 */
export function extractPrimaryURL(text) {
  const urls = extractURLs(text);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Check if text contains URL
 * @param {string} text - Text to check
 * @returns {boolean} Whether text contains URL
 */
export function containsURL(text) {
  return extractURLs(text).length > 0;
}

/**
 * Clean URL (remove tracking parameters)
 * @param {string} url - URL to clean
 * @returns {string} Cleaned URL
 */
export function cleanURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'referrer'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    return url; // Return original if parsing fails
  }
}
