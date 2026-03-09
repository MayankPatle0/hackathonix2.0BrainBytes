/**
 * TikTok Extractor
 * Supports: Regular videos, Live content
 */
if (typeof TikTokExtractor === 'undefined') {
    window.TikTokExtractor = class TikTokExtractor extends BaseExtractor {
        constructor() {
            super('tiktok');
        }
    
    extract() {
        const content = this.baseContent('video');
        
        // Video element
        const video = this.query('video');
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
        }
        
        // Caption/Description - TikTok uses data attributes
        const caption = this.query([
            '[data-e2e="browse-video-desc"]',
            '[data-e2e="video-desc"]',
            'h1[data-e2e="browse-video-desc"]',
            '.tiktok-j2a19r-SpanText'
        ]);
        content.caption = safeText(caption);
        
        // Author info
        const authorLink = this.query([
            '[data-e2e="browse-username"]',
            'a[data-e2e="video-author-uniqueid"]',
            '[data-e2e="video-author"]'
        ]);
        
        if (authorLink) {
            content.author = {
                username: safeText(authorLink).replace('@', ''),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Extract hashtags from caption
        const hashtags = this.extractHashtags(content.caption);
        if (hashtags.length > 0) content.hashtags = hashtags;
        
        // Audio/Music name
        const musicLink = this.query([
            '[data-e2e="browse-music"]',
            '[data-e2e="video-music"]',
            'a[href*="/music/"]'
        ]);
        
        if (musicLink) {
            content.music = safeText(musicLink);
        }
        
        // Engagement metrics
        const engagement = {};
        
        const likes = this.query('[data-e2e="like-count"]');
        const comments = this.query('[data-e2e="comment-count"]');
        const shares = this.query('[data-e2e="share-count"]');
        const views = this.query('[data-e2e="video-views"]');
        
        if (likes) engagement.likes = safeText(likes);
        if (comments) engagement.comments = safeText(comments);
        if (shares) engagement.shares = safeText(shares);
        if (views) engagement.views = safeText(views);
        
        if (Object.keys(engagement).length > 0) {
            content.engagement = engagement;
        }
        
        // Video timestamp
        const timestamp = this.query('[data-e2e="browser-nickname"] + span');
        if (timestamp) {
            content.postedAt = safeText(timestamp);
        }
        
        return content;
    }
}
}

