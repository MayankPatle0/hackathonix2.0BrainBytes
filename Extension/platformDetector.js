/**
 * Platform Detector - Identifies which platform the current URL belongs to
 * @returns {string} Platform name or 'article' for default
 */
if (typeof detectPlatform === 'undefined') {
    window.detectPlatform = function(url) {
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
        
        // Default to article extraction for everything else
        return 'article';
    };
}

/**
 * Helper function to safely query elements with multiple selectors
 * @param {Array<string>} selectors - Array of CSS selectors to try
 * @returns {Element|null} First matching element or null
 */
if (typeof queryMultiple === 'undefined') {
    window.queryMultiple = function(selectors, context = document) {
        for (const selector of selectors) {
            try {
                const element = context.querySelector(selector);
                if (element) return element;
            } catch (e) {
                // Invalid selector, continue to next
                continue;
            }
        }
        return null;
    };
}

/**
 * Helper to get safe text content
 */
if (typeof safeText === 'undefined') {
    window.safeText = function(element) {
        return element ? element.innerText.trim() : '';
    };
}

/**
 * Helper to get safe attribute
 */
if (typeof safeAttr === 'undefined') {
    window.safeAttr = function(element, attr) {
        return element ? element.getAttribute(attr) : '';
    };
}

/**
 * Helper to extract text safely
 */
function safeText(element) {
    return element?.textContent?.trim() || '';
}

/**
 * Helper to extract attribute safely
 */
function safeAttr(element, attr) {
    return element?.getAttribute(attr) || '';
}
