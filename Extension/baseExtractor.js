/**
 * Base Extractor Class
 * All platform extractors extend this class
 */
if (typeof BaseExtractor === 'undefined') {
    class BaseExtractor {
        constructor(platform) {
            this.platform = platform;
            this.url = window.location.href;
            this.timestamp = new Date().toISOString();
        }
        
        /**
         * Query with multiple selectors as fallback
         */
        query(selectors, context = document) {
            // Ensure queryMultiple exists or fallback
            if (typeof queryMultiple === 'function') {
                return queryMultiple(Array.isArray(selectors) ? selectors : [selectors], context);
            }
            // Fallback if queryMultiple is missing
            const selectorList = Array.isArray(selectors) ? selectors : [selectors];
            for (const sel of selectorList) {
                const el = context.querySelector(sel);
                if (el) return el;
            }
            return null;
        }
        
        /**
         * Query all matching elements
         */
        queryAll(selector, context = document) {
            try {
                return Array.from(context.querySelectorAll(selector));
            } catch (e) {
                return [];
            }
        }
        
        /**
         * Extract base content structure
         */
        baseContent(type = 'post') {
            return {
                platform: this.platform,
                type,
                url: this.url,
                timestamp: this.timestamp
            };
        }
        
        /**
         * Wait for element to appear (for lazy-loaded content)
         */
        async waitForElement(selector, timeout = 5000) {
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(selector);
                if (element) return element;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return null;
        }
        
        /**
         * Extract hashtags from text
         */
        extractHashtags(text) {
            if (!text) return [];
            const matches = text.match(/#[\w]+/g);
            return matches ? matches.map(tag => tag.toLowerCase()) : [];
        }
        
        /**
         * Extract mentions from text
         */
        extractMentions(text) {
            if (!text) return [];
            const matches = text.match(/@[\w]+/g);
            return matches ? matches : [];
        }
        
        /**
         * Main extract method - to be overridden by subclasses
         */
        extract() {
            throw new Error('Extract method must be implemented by subclass');
        }
    }
    window.BaseExtractor = BaseExtractor;
}
