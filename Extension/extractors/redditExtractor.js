/**
 * Reddit Extractor
 * Supports: Posts, Comments, Images, Videos
 */
if (typeof RedditExtractor === 'undefined') {
    window.RedditExtractor = class RedditExtractor extends BaseExtractor {
        constructor() {
            super('reddit');
        }
    
    extract() {
        const content = this.baseContent('post');
        
        // Post title
        const title = this.query([
            'h1',
            '[slot="title"]',
            '[data-test-id="post-content"] h1',
            'shreddit-title h1'
        ]);
        content.title = safeText(title);
        
        // Post content/text
        const postContent = this.query([
            '[data-test-id="post-content"] > div',
            '[slot="text-body"]',
            '.md',
            '[data-click-id="text"]'
        ]);
        content.text = safeText(postContent);
        
        // Author
        const authorLink = this.query([
            '[data-testid="post-author"]',
            'a[href*="/user/"]',
            '[slot="authorName"] a'
        ]);
        
        if (authorLink) {
            content.author = safeText(authorLink).replace('u/', '');
        }
        
        // Subreddit
        const subredditLink = this.query([
            '[data-testid="subreddit-name"]',
            'a[href*="/r/"]',
            '[slot="subreddit"]'
        ]);
        
        if (subredditLink) {
            content.subreddit = safeText(subredditLink).replace('r/', '');
        }
        
        // Images
        const images = this.queryAll([
            '[data-test-id="post-content"] img',
            'shreddit-post img[slot="thumbnail"]',
            'img.ImageBox-image'
        ].join(','));
        
        const imageUrls = images
            .map(img => safeAttr(img, 'src'))
            .filter(src => src && !src.includes('emoji') && !src.includes('avatar'));
        
        if (imageUrls.length > 0) content.images = imageUrls;
        
        // Video
        const video = this.query([
            'shreddit-player video',
            '[data-test-id="post-content"] video',
            'video'
        ]);
        
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
            content.hasVideo = true;
        }
        
        // External link (for link posts)
        const externalLink = this.query([
            'a[data-testid="outbound-link"]',
            '[slot="outbound-link"]'
        ]);
        
        if (externalLink) {
            content.externalUrl = safeAttr(externalLink, 'href');
        }
        
        // Engagement metrics
        const engagement = {};
        
        const upvotes = this.query([
            '[data-test-id="vote-count"]',
            'shreddit-post faceplate-number',
            '.score'
        ]);
        
        const commentsLink = this.query([
            '[data-testid="comments-page-link-num-comments"]',
            'a[href*="/comments/"]',
            '[slot="commentCount"]'
        ]);
        
        if (upvotes) engagement.upvotes = safeText(upvotes);
        if (commentsLink) {
            const commentText = safeText(commentsLink);
            const match = commentText.match(/\d+/);
            if (match) engagement.comments = match[0];
        }
        
        if (Object.keys(engagement).length > 0) {
            content.engagement = engagement;
        }
        
        // Post flair (category/tag)
        const flair = this.query([
            '[data-testid="post-flair"]',
            'faceplate-tracker[noun="post_flair"]',
            '.linkflairlabel'
        ]);
        
        if (flair) {
            content.flair = safeText(flair);
        }
        
        // Timestamp
        const timeElement = this.query('time');
        if (timeElement) {
            content.postedAt = safeAttr(timeElement, 'datetime') || safeText(timeElement);
        }
        
        return content;
    }
}
}

