/**
 * Facebook Extractor
 * Supports: Posts, Videos, Photos
 * Note: Facebook's DOM is heavily obfuscated and changes frequently
 */
if (typeof FacebookExtractor === 'undefined') {
    window.FacebookExtractor = class FacebookExtractor extends BaseExtractor {
        constructor() {
            super('facebook');
        }
    
    extract() {
        const content = this.baseContent('post');
        
        // Facebook uses lots of dynamically generated class names
        // We look for data attributes and semantic HTML
        
        // Post text - Facebook makes this difficult
        const postText = this.query([
            '[data-ad-comet-preview="message"]',
            '[data-ad-preview="message"]',
            'div[dir="auto"][style*="text-align"]',
            '[data-testid="post_message"]',
            '.userContent'
        ]);
        content.text = safeText(postText);
        
        // Author name
        const authorName = this.query([
            'h2 a strong',
            'h3 a strong',
            'strong a',
            '[data-testid="post_author"] strong',
            'h4 strong'
        ]);
        
        const authorLink = this.query([
            'h2 a',
            'h3 a',
            '[role="article"] h4 a',
            '[data-testid="post_author"] a'
        ]);
        
        if (authorName || authorLink) {
            content.author = {
                name: safeText(authorName),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Images
        const images = this.queryAll([
            'img[data-visualcompletion="media-vc-image"]',
            '[role="article"] img[referrerpolicy="origin-when-cross-origin"]',
            'a[data-sigil="photo-image"] img'
        ].join(','));
        
        const imageUrls = images
            .map(img => safeAttr(img, 'src'))
            .filter(src => src && !src.includes('emoji') && !src.includes('profile'));
        
        if (imageUrls.length > 0) content.images = imageUrls;
        
        // Video
        const video = this.query([
            'video[data-video-id]',
            'video',
            '[data-testid="post_video"]'
        ]);
        
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
            content.hasVideo = true;
        }
        
        // Engagement - Facebook hides this in various ways
        const engagement = {};
        
        // Look for reaction counts
        const reactionCount = this.query([
            '[aria-label*="people reacted"]',
            'span[aria-hidden] span'
        ]);
        
        if (reactionCount) {
            const text = safeText(reactionCount);
            const match = text.match(/\d+/);
            if (match) engagement.reactions = match[0];
        }
        
        // Comments and shares
        const commentLink = this.query('[aria-label*="comment"]');
        const shareLink = this.query('[aria-label*="share"]');
        
        if (commentLink) {
            const ariaLabel = safeAttr(commentLink, 'aria-label');
            const match = ariaLabel.match(/\d+/);
            if (match) engagement.comments = match[0];
        }
        
        if (shareLink) {
            const ariaLabel = safeAttr(shareLink, 'aria-label');
            const match = ariaLabel.match(/\d+/);
            if (match) engagement.shares = match[0];
        }
        
        if (Object.keys(engagement).length > 0) {
            content.engagement = engagement;
        }
        
        // Timestamp
        const timeElement = this.query([
            'abbr[data-utime]',
            'a abbr',
            '[role="article"] abbr'
        ]);
        
        if (timeElement) {
            const utime = safeAttr(timeElement, 'data-utime');
            if (utime) {
                content.postedAt = new Date(parseInt(utime) * 1000).toISOString();
            } else {
                content.postedAt = safeText(timeElement);
            }
        }
        
        // Extract hashtags
        const hashtags = this.extractHashtags(content.text);
        if (hashtags.length > 0) content.hashtags = hashtags;
        
        return content;
    }
}
}

