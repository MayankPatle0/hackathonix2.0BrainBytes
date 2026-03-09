/**
 * YouTube Extractor
 * Supports: Regular videos, Shorts, Live streams
 */
if (typeof YouTubeExtractor === 'undefined') {
    window.YouTubeExtractor = class YouTubeExtractor extends BaseExtractor {
        constructor() {
            super('youtube');
        }
        
        extract() {
            const content = this.baseContent('video');
            
            // Detect Shorts vs regular video
            if (window.location.pathname.includes('/shorts/')) {
                content.type = 'short';
                return this.extractShort(content);
            } else if (window.location.pathname.includes('/watch')) {
                return this.extractVideo(content);
            }
            
            return content;
        }
        
        extractVideo(content) {
            // Video title
            const title = this.query([
                'h1.ytd-watch-metadata yt-formatted-string',
                '#title h1',
                'h1.title'
            ]);
            content.title = safeText(title);
            
            // Channel info
            const channelLink = this.query([
                'ytd-channel-name a',
                '#channel-name a',
                '#owner a'
            ]);
            
            if (channelLink) {
                content.channel = {
                    name: safeText(channelLink),
                    url: safeAttr(channelLink, 'href')
                };
            }
            
            // Description
            const description = this.query([
                'ytd-text-inline-expander #description-inline-expander',
                '#description',
            '.description'
        ]);
        content.description = safeText(description);
        
        // Video ID and embed URL
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        
        if (videoId) {
            content.videoId = videoId;
            content.embedUrl = `https://www.youtube.com/embed/${videoId}`;
            content.thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        }
        
        // Engagement metrics
        const engagement = {};
        
        // Likes (new button structure)
        const likeButton = this.query([
            'like-button-view-model button',
            '#segmented-like-button button',
            'ytd-toggle-button-renderer[target-id="watch-like"]'
        ]);
        
        if (likeButton) {
            const ariaLabel = safeAttr(likeButton, 'aria-label');
            const likesMatch = ariaLabel.match(/[\d,]+/);
            if (likesMatch) engagement.likes = likesMatch[0];
        }
        
        // Views
        const viewsElement = this.query([
            'ytd-watch-metadata span.view-count',
            '#info span.view-count',
            '.view-count'
        ]);
        const viewsText = safeText(viewsElement);
        if (viewsText) engagement.views = viewsText;
        
        // Upload date
        const dateElement = this.query([
            'ytd-watch-metadata #info-strings yt-formatted-string',
            '#info-strings yt-formatted-string'
        ]);
        if (dateElement) {
            const dateText = safeText(dateElement);
            if (dateText) content.uploadDate = dateText;
        }
        
        if (Object.keys(engagement).length > 0) {
            content.engagement = engagement;
        }
        
        // Tags from meta
        const keywords = document.querySelector('meta[name="keywords"]');
        if (keywords) {
            const tags = safeAttr(keywords, 'content').split(',').map(t => t.trim()).filter(t => t);
            if (tags.length > 0) content.tags = tags;
        }
        
        // Category
        const category = document.querySelector('meta[itemprop="genre"]');
        if (category) {
            content.category = safeAttr(category, 'content');
        }
        
        return content;
    }
    
    extractShort(content) {
        // Shorts have a different layout
        const title = this.query([
            '#title h2',
            'h2.title',
            '[class*="title"]'
        ]);
        content.title = safeText(title);
        
        // Channel
        const channelLink = this.query('#channel-name a');
        if (channelLink) {
            content.channel = {
                name: safeText(channelLink),
                url: safeAttr(channelLink, 'href')
            };
        }
        
        // Description
        const description = this.query('#description');
        content.description = safeText(description);
        
        // Video ID from URL
        const pathParts = window.location.pathname.split('/');
        const shortIdIndex = pathParts.indexOf('shorts') + 1;
        if (shortIdIndex > 0 && pathParts[shortIdIndex]) {
            content.videoId = pathParts[shortIdIndex];
            content.embedUrl = `https://www.youtube.com/embed/${content.videoId}`;
        }
        
        // Engagement (Shorts show likes differently)
        const likeButton = this.query('[aria-label*="like"]');
        if (likeButton) {
            const ariaLabel = safeAttr(likeButton, 'aria-label');
            const likesMatch = ariaLabel.match(/[\d,]+/);
            if (likesMatch) {
                content.engagement = { likes: likesMatch[0] };
            }
        }
        
        return content;
    }
    }
    window.YouTubeExtractor = YouTubeExtractor;
}
