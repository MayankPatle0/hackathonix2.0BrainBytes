/**
 * LinkedIn Extractor
 * Supports: Posts, Articles, Videos
 */
if (typeof LinkedInExtractor === 'undefined') {
    window.LinkedInExtractor = class LinkedInExtractor extends BaseExtractor {
        constructor() {
            super('linkedin');
        }
    
    extract() {
        const content = this.baseContent('post');
        
        // Determine if it's an article or post
        if (window.location.pathname.includes('/pulse/')) {
            content.type = 'article';
            return this.extractArticle(content);
        }
        
        return this.extractPost(content);
    }
    
    extractPost(content) {
        // Post text content
        const postText = this.query([
            '.feed-shared-update-v2__description',
            '.feed-shared-text__text-view',
            '.break-words',
            '[data-test-id="main-feed-activity-card__commentary"]'
        ]);
        content.text = safeText(postText);
        
        // Author info
        const authorName = this.query([
            '.update-components-actor__name',
            '.feed-shared-actor__name',
            '[data-test-id="main-feed-activity-card__actor-name"]'
        ]);
        
        const authorLink = this.query([
            '.update-components-actor__container a',
            '.feed-shared-actor a'
        ]);
        
        if (authorName || authorLink) {
            content.author = {
                name: safeText(authorName),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Images
        const images = this.queryAll([
            '.update-components-image img',
            '.feed-shared-image__container img'
        ].join(','));
        
        const imageUrls = images.map(img => safeAttr(img, 'src')).filter(src => src);
        if (imageUrls.length > 0) content.images = imageUrls;
        
        // Video
        const video = this.query('video');
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
            content.hasVideo = true;
        }
        
        // Engagement metrics
        const engagement = {};
        
        const reactions = this.query([
            '.social-details-social-counts__reactions-count',
            '[data-test-id="social-actions__reaction-count"]'
        ]);
        
        const commentsCount = this.query([
            '.social-details-social-counts__comments',
            '[data-test-id="social-actions__comment-count"]'
        ]);
        
        const sharesCount = this.query('.social-details-social-counts__shares');
        
        if (reactions) engagement.reactions = safeText(reactions);
        if (commentsCount) engagement.comments = safeText(commentsCount);
        if (sharesCount) engagement.shares = safeText(sharesCount);
        
        if (Object.keys(engagement).length > 0) {
            content.engagement = engagement;
        }
        
        // Timestamp
        const timeElement = this.query('.update-components-actor__sub-description time');
        if (timeElement) {
            content.postedAt = safeAttr(timeElement, 'datetime') || safeText(timeElement);
        }
        
        return content;
    }
    
    extractArticle(content) {
        // Article title
        const title = this.query([
            'h1.article-title',
            '.reader-article-header h1',
            'h1'
        ]);
        content.title = safeText(title);
        
        // Article content
        const articleBody = this.query([
            '.reader-article-content',
            '.article-content',
            'article'
        ]);
        content.text = safeText(articleBody);
        
        // Author
        const authorName = this.query('.reader-author-info__author-name');
        const authorLink = this.query('.reader-author-info a');
        
        if (authorName || authorLink) {
            content.author = {
                name: safeText(authorName),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Published date
        const publishDate = this.query('.reader-article-header time');
        if (publishDate) {
            content.publishedAt = safeAttr(publishDate, 'datetime') || safeText(publishDate);
        }
        
        return content;
    }
}
}

