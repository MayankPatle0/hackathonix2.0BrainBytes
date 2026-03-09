/**
 * Twitter/X Extractor
 * Supports: Tweets, Threads, Quoted Tweets, Images, Videos
 */
if (typeof TwitterExtractor === 'undefined') {
    window.TwitterExtractor = class TwitterExtractor extends BaseExtractor {
        constructor() {
            super('twitter');
        }
    
    extract() {
        const content = this.baseContent('tweet');
        
        // Main tweet article
        const article = this.query([
            'article[data-testid="tweet"]',
            'article[role="article"]'
        ]);
        
        if (!article) {
            // Fallback: Try to get any tweet data
            return this.extractFallback(content);
        }
        
        // Author info
        const authorContainer = this.query([
            '[data-testid="User-Name"]',
            '[data-testid="UserName"]'
        ], article);
        
        if (authorContainer) {
            const spans = this.queryAll('span', authorContainer);
            content.author = {
                name: safeText(spans[0]),
                username: safeText(spans[1])?.replace('@', '') || safeText(spans[0])
            };
        }
        
        // Tweet text
        const tweetText = this.query([
            '[data-testid="tweetText"]',
            '.tweet-text',
            '[lang]'
        ], article);
        
        content.text = safeText(tweetText);
        
        // Timestamp
        const timeElement = this.query('time', article);
        if (timeElement) {
            content.postedAt = safeAttr(timeElement, 'datetime');
        }
        
        // Engagement metrics
        const metricsGroup = this.query('[role="group"]', article);
        if (metricsGroup) {
            const metrics = this.queryAll('[data-testid*="count"]', metricsGroup);
            const engagement = {};
            
            metrics.forEach(metric => {
                const testId = safeAttr(metric, 'data-testid');
                const count = safeText(metric);
                
                if (testId.includes('reply')) engagement.replies = count;
                else if (testId.includes('retweet')) engagement.retweets = count;
                else if (testId.includes('like')) engagement.likes = count;
                else if (testId.includes('view')) engagement.views = count;
            });
            
            if (Object.keys(engagement).length > 0) {
                content.engagement = engagement;
            }
        }
        
        // Media (images/videos)
        const media = [];
        
        // Images
        const images = this.queryAll('img[alt="Image"]', article);
        images.forEach(img => {
            const src = safeAttr(img, 'src');
            if (src && !src.includes('profile')) {
                media.push({ type: 'image', url: src });
            }
        });
        
        // Videos
        const videos = this.queryAll('video', article);
        videos.forEach(vid => {
            const src = safeAttr(vid, 'src') || safeAttr(vid, 'poster');
            if (src) media.push({ type: 'video', url: src });
        });
        
        if (media.length > 0) content.media = media;
        
        // Extract hashtags and mentions
        const hashtags = this.extractHashtags(content.text);
        const mentions = this.extractMentions(content.text);
        
        if (hashtags.length > 0) content.hashtags = hashtags;
        if (mentions.length > 0) content.mentions = mentions;
        
        // Quoted tweet
        const quotedTweet = this.query('[data-testid="tweet"]', article);
        if (quotedTweet && quotedTweet !== article) {
            content.hasQuotedTweet = true;
        }
        
        return content;
    }
    
    extractFallback(content) {
        // Try to get any visible text
        const mainText = this.query('article')?.textContent?.trim();
        if (mainText) content.text = mainText;
        
        return content;
    }
}
}

