/**
 * Instagram Extractor
 * Supports: Posts, Reels, Stories, Carousels
 */
if (typeof InstagramExtractor === 'undefined') {
    window.InstagramExtractor = class InstagramExtractor extends BaseExtractor {
        constructor() {
            super('instagram');
        }
    
    extract() {
        const pathname = window.location.pathname;
        
        // Detect content type
        if (pathname.includes('/reel/')) {
            return this.extractReel();
        } else if (pathname.includes('/p/')) {
            return this.extractPost();
        } else if (pathname.includes('/stories/')) {
            return this.extractStory();
        } else if (pathname.includes('/tv/')) {
            return this.extractIGTV();
        }
        
        return this.baseContent('unknown');
    }
    
   extractReel() {
        const content = this.baseContent('reel');
        
        // Video element
        const video = this.query('video');
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
            content.poster = safeAttr(video, 'poster');
        }
        
        // Caption - multiple possible selectors
        const caption = this.query([
            'h1',
            '[class*="Caption"]',
            'span[dir="auto"]'
        ]);
        content.caption = safeText(caption);
        
        // Author
        const authorLink = this.query([
            'header a[role="link"]',
            'header a',
            'a[href*="instagram.com"]'
        ]);
        
        if (authorLink) {
            content.author = {
                username: safeText(authorLink).replace('@', ''),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Engagement
        const likesSection = this.query('[class*="Section"]');
        if (likesSection) {
            const spans = this.queryAll('span', likesSection);
            spans.forEach(span => {
                const text = safeText(span);
                if (text.includes('like')) content.likes = text;
                if (text.includes('view')) content.views = text;
            });
        }
        
        // Extract hashtags from caption
        const hashtags = this.extractHashtags(content.caption);
        if (hashtags.length > 0) content.hashtags = hashtags;
        
        // Audio name (for Reels)
        const audioLink = this.query('a[href*="/audio/"]');
        if (audioLink) {
            content.audio = safeText(audioLink);
        }
        
        return content;
    }
    
    extractPost() {
        const content = this.baseContent('post');
        
        // Images - can be carousel
        const images = this.queryAll('article img[srcset]');
        const imageUrls = [];
        
        images.forEach(img => {
            const src = safeAttr(img, 'src');
            if (src && !src.includes('profile') && !src.includes('emoji')) {
                imageUrls.push(src);
            }
        });
        
        if (imageUrls.length > 0) content.images = imageUrls;
        if (imageUrls.length > 1) content.isCarousel = true;
        
        // Caption
        const caption = this.query('h1');
        content.caption = safeText(caption);
        
        // Author (same as reel)
        const authorLink = this.query('header a');
        if (authorLink) {
            content.author = {
                username: safeText(authorLink),
                profileUrl: safeAttr(authorLink, 'href')
            };
        }
        
        // Hashtags
        const hashtags = this.extractHashtags(content.caption);
        if (hashtags.length > 0) content.hashtags = hashtags;
        
        return content;
    }
    
    extractStory() {
        const content = this.baseContent('story');
        
        // Stories are tricky - try to get video or image
        const video = this.query('video');
        if (video) {
            content.videoUrl = safeAttr(video, 'src');
        } else {
            const image = this.query('img[draggable="false"]');
            if (image) content.imageUrl = safeAttr(image, 'src');
        }
        
        // Author from URL
        const pathParts = window.location.pathname.split('/');
        const storyIndex = pathParts.indexOf('stories');
        if (storyIndex >= 0 && pathParts[storyIndex + 1]) {
            content.author = { username: pathParts[storyIndex + 1] };
        }
        
        return content;
    }
    
    extractIGTV() {
        // IGTV is similar to reels
        return this.extractReel();
    }
}
}

