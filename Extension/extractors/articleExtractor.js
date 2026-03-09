/**
 * Article Extractor
 * Uses Readability.js for clean article extraction
 * Fallback for non-social media sites
 */
if (typeof ArticleExtractor === 'undefined') {
    window.ArticleExtractor = class ArticleExtractor extends BaseExtractor {
        constructor() {
            super('article');
        }
    
    extract() {
        const content = this.baseContent('article');
        
        try {
            // Use Readability.js if available
            if (typeof Readability !== 'undefined') {
                const documentClone = document.cloneNode(true);
                const reader = new Readability(documentClone);
                const article = reader.parse();
                
                if (article) {
                    content.title = article.title || document.title;
                    content.text = article.textContent || '';
                    content.excerpt = article.excerpt || '';
                    content.author = article.byline || '';
                    content.length = article.length || 0;
                    content.siteName = article.siteName || '';
                    
                    return content;
                }
            }
        } catch (error) {
            console.warn('Readability failed, using fallback:', error);
        }
        
        // Fallback extraction
        return this.extractFallback(content);
    }
    
    extractFallback(content) {
        // Try to get title
        const title = this.query([
            'h1',
            'meta[property="og:title"]',
            'title'
        ]);
        
        if (title.tagName === 'META') {
            content.title = safeAttr(title, 'content');
        } else {
            content.title = safeText(title) || document.title;
        }
        
        // Try to get main content
        const mainContent = this.query([
            'article',
            'main',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content'
        ]);
        
        if (mainContent) {
            content.text = safeText(mainContent);
        } else {
            // Last resort - get all paragraphs
            const paragraphs = this.queryAll('p');
            content.text = paragraphs.map(p => safeText(p)).join('\n\n');
        }
        
        // Try to get author
        const author = this.query([
            '[rel="author"]',
            '.author',
            '[itemprop="author"]',
            'meta[name="author"]'
        ]);
        
        if (author) {
            if (author.tagName === 'META') {
                content.author = safeAttr(author, 'content');
            } else {
                content.author = safeText(author);
            }
        }
        
        // Try to get publish date
        const dateElement = this.query([
            'time[datetime]',
            '[itemprop="datePublished"]',
            'meta[property="article:published_time"]'
        ]);
        
        if (dateElement) {
            if (dateElement.tagName === 'META') {
                content.publishedAt = safeAttr(dateElement, 'content');
            } else {
                content.publishedAt = safeAttr(dateElement, 'datetime') || safeText(dateElement);
            }
        }
        
        // Get images from article
        const images = this.queryAll('article img, main img, .post-content img');
        const imageUrls = images
            .map(img => safeAttr(img, 'src'))
            .filter(src => src && !src.includes('emoji') && !src.includes('icon'));
        
        if (imageUrls.length > 0) {
            content.images = imageUrls;
        }
        
        // Get meta description
        const metaDesc = this.query('meta[name="description"]');
        if (metaDesc) {
            content.description = safeAttr(metaDesc, 'content');
        }
        
        return content;
    }
}
}

