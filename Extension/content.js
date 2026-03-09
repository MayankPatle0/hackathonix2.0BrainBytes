// Nexus Content Script - Complete Platform Support

// Prevent multiple injections
if (typeof window.NEXUS_CONTENT_LOADED === 'undefined') {
    window.NEXUS_CONTENT_LOADED = true;

    /**
     * Get backend URL from configuration
     */
    const getBackendUrl = () => {
        return "https://complete-nexus.onrender.com";
    };

    /**
     * 1. MISSING HELPER: Detect Platform based on URL
     */
    if (typeof window.detectPlatform === 'undefined') {
        window.detectPlatform = function(url) {
            if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
            if (url.includes('instagram.com')) return 'instagram';
            if (url.includes('facebook.com')) return 'facebook';
            if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
            if (url.includes('tiktok.com')) return 'tiktok';
            if (url.includes('linkedin.com')) return 'linkedin';
            if (url.includes('reddit.com')) return 'reddit';
            return 'article'; // Default
        };
    }

    /**
     * 2. MISSING CLASSES: Placeholder Extractors to prevent ReferenceErrors
     * Note: You should replace the extract() logic below with your actual scraping logic.
     */
    class BaseExtractor {
        extract() {
            return {
                platform: window.detectPlatform(window.location.href),
                url: window.location.href,
                title: document.title,
                text: document.body.innerText.substring(0, 5000), // Limit text capture
                type: 'post'
            };
        }
    }

    // Define extractors if they don't exist
    if (typeof window.ArticleExtractor === 'undefined') window.ArticleExtractor = class extends BaseExtractor {};
    if (typeof window.TwitterExtractor === 'undefined') window.TwitterExtractor = class extends BaseExtractor {};
    if (typeof window.InstagramExtractor === 'undefined') window.InstagramExtractor = class extends BaseExtractor {};
    if (typeof window.FacebookExtractor === 'undefined') window.FacebookExtractor = class extends BaseExtractor {};
    if (typeof window.YouTubeExtractor === 'undefined') window.YouTubeExtractor = class extends BaseExtractor {};
    if (typeof window.TikTokExtractor === 'undefined') window.TikTokExtractor = class extends BaseExtractor {};
    if (typeof window.LinkedInExtractor === 'undefined') window.LinkedInExtractor = class extends BaseExtractor {};
    if (typeof window.RedditExtractor === 'undefined') window.RedditExtractor = class extends BaseExtractor {};

    /**
     * Poll job status until complete or failed
     */
    if (typeof window.pollJobStatus === 'undefined') {
        window.pollJobStatus = async function(jobId) {
            const SERVER_URL = getBackendUrl();
            const maxAttempts = 15; // 30 seconds max (15 * 2s)

            for (let i = 0; i < maxAttempts; i++) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

                    const statusRes = await fetch(`${SERVER_URL}/jobs/${jobId}`);
                    if (!statusRes.ok) {
                        console.warn(`Nexus: Job status check failed (attempt ${i + 1})`);
                        continue;
                    }

                    const { state, result, reason } = await statusRes.json();

                    if (state === 'completed') {
                        console.log('✅ Nexus: Memory saved successfully!', result);
                        return { success: true, result };
                    } else if (state === 'failed') {
                        console.error('❌ Nexus: Processing failed -', reason);
                        return { success: false, error: reason };
                    } else {
                        console.log(`⏳ Nexus: Processing... (${state})`);
                    }
                } catch (error) {
                    console.warn('Nexus: Polling error, retrying...', error.message);
                }
            }

            console.warn('⚠️ Nexus: Processing timed out. Check your dashboard.');
            return { success: false, error: 'Timeout' };
        };
    }

    /**
     * Main content extraction function
     */
    if (typeof window.extractContent === 'undefined') {
        window.extractContent = async function() {
            const url = window.location.href;
            const platform = window.detectPlatform(url);

            console.log(`🔍 Nexus: Detected platform - ${platform}`);

            let extractedData = null;

            try {
                // Select appropriate extractor
                switch (platform) {
                    case 'twitter':
                        extractedData = new window.TwitterExtractor().extract();
                        break;
                    case 'instagram':
                        extractedData = new window.InstagramExtractor().extract();
                        break;
                    case 'facebook':
                        extractedData = new window.FacebookExtractor().extract();
                        break;
                    case 'youtube':
                        extractedData = new window.YouTubeExtractor().extract();
                        break;
                    case 'tiktok':
                        extractedData = new window.TikTokExtractor().extract();
                        break;
                    case 'linkedin':
                        extractedData = new window.LinkedInExtractor().extract();
                        break;
                    case 'reddit':
                        extractedData = new window.RedditExtractor().extract();
                        break;
                    default:
                        // Use article extractor with Readability
                        extractedData = new window.ArticleExtractor().extract();
                }

                console.log('📦 Nexus: Extracted data:', extractedData);

                await window.sendDataToBackend(extractedData);

            } catch (error) {
                console.error('❌ Nexus: Extraction failed', error);
                // Try fallback extraction
                try {
                    const fallbackData = new window.ArticleExtractor().extract();
                    await window.sendDataToBackend(fallbackData);
                } catch (fallbackError) {
                    console.error('❌ Nexus: Fallback extraction also failed', fallbackError);
                }
            }
        };
    }

    /**
     * Convert extracted data to formatted text for backend
     */
    if (typeof window.formatDataForBackend === 'undefined') {
        window.formatDataForBackend = function(data) {
            let formatted = `Platform: ${data.platform || 'Unknown'}\n`;
            formatted += `Type: ${data.type || 'General'}\n`;
            formatted += `URL: ${data.url || window.location.href}\n`;
            formatted += `Captured: ${new Date().toLocaleString()}\n\n`;

            // Add separator
            formatted += '─'.repeat(50) + '\n\n';

            // Title
            if (data.title) {
                formatted += `📍 TITLE:\n${data.title}\n\n`;
            }

            // Author
            if (data.author) {
                const authorStr = typeof data.author === 'object' ?
                    `${data.author.name || data.author.username || 'Unknown'}${data.author.profileUrl ? ` (${data.author.profileUrl})` : ''}` :
                    data.author;
                formatted += `👤 AUTHOR: ${authorStr}\n\n`;
            }

            // Channel (YouTube)
            if (data.channel) {
                formatted += `📺 CHANNEL: ${data.channel.name}${data.channel.url ? ` (${data.channel.url})` : ''}\n\n`;
            }

            // Subreddit (Reddit)
            if (data.subreddit) {
                formatted += `🔖 SUBREDDIT: r/${data.subreddit}\n\n`;
            }

            // Main content
            if (data.text) {
                formatted += `📄 CONTENT:\n${data.text}\n\n`;
            }

            if (data.caption) {
                formatted += `💬 CAPTION:\n${data.caption}\n\n`;
            }

            if (data.description) {
                formatted += `📝 DESCRIPTION:\n${data.description}\n\n`;
            }

            // Metadata
            if (data.hashtags && data.hashtags.length > 0) {
                formatted += `🏷️ HASHTAGS: ${data.hashtags.join(' ')}\n\n`;
            }

            if (data.mentions && data.mentions.length > 0) {
                formatted += `@️ MENTIONS: ${data.mentions.join(' ')}\n\n`;
            }

            if (data.tags && data.tags.length > 0) {
                formatted += `🔖 TAGS: ${data.tags.join(', ')}\n\n`;
            }

            if (data.music) {
                formatted += `🎵 MUSIC: ${data.music}\n\n`;
            }

            if (data.flair) {
                formatted += `🔰 FLAIR: ${data.flair}\n\n`;
            }

            // Timestamps
            if (data.postedAt || data.publishedAt || data.uploadDate) {
                const timestamp = data.postedAt || data.publishedAt || data.uploadDate;
                formatted += `📅 POSTED: ${timestamp}\n\n`;
            }

            // Engagement
            if (data.engagement) {
                formatted += `📊 ENGAGEMENT:\n`;
                Object.entries(data.engagement).forEach(([key, value]) => {
                    formatted += `  ${key}: ${value}\n`;
                });
                formatted += '\n';
            }

            // Media
            if (data.videoUrl) {
                formatted += `🎥 VIDEO: ${data.videoUrl}\n`;
            }

            if (data.embedUrl) {
                formatted += `🔗 EMBED: ${data.embedUrl}\n`;
            }

            if (data.images && data.images.length > 0) {
                formatted += `🖼️ IMAGES (${data.images.length}):\n`;
                data.images.slice(0, 5).forEach((img, i) => {
                    formatted += `  ${i + 1}. ${img}\n`;
                });
                if (data.images.length > 5) {
                    formatted += `  ... and ${data.images.length - 5} more\n`;
                }
                formatted += '\n';
            }

            if (data.media && data.media.length > 0) {
                formatted += `📂 MEDIA (${data.media.length}):\n`;
                data.media.forEach((m, i) => {
                    formatted += `  ${i + 1}. [${m.type}] ${m.url}\n`;
                });
                formatted += '\n';
            }

            if (data.externalUrl) {
                formatted += `🔗 EXTERNAL LINK: ${data.externalUrl}\n\n`;
            }

            // Additional metadata
            if (data.category) {
                formatted += `📂 CATEGORY: ${data.category}\n\n`;
            }

            if (data.siteName) {
                formatted += `🌐 SITE: ${data.siteName}\n\n`;
            }

            return formatted;
        };
    }

    /**
     * Send extracted data to backend
     */
    if (typeof window.sendDataToBackend === 'undefined') {
        window.sendDataToBackend = async function(data) {
            const SERVER_URL = `${getBackendUrl()}/receive_data?source=W`;

            const rawTextToSend = window.formatDataForBackend(data);

            console.log("--- Sending to Nexus Backend ---");

            try {
                // Check if chrome.storage is available (browser extension context)
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    console.warn("⚠️ Nexus: Chrome storage API not available.");
                    return;
                }

                const { supabase_auth_token } = await chrome.storage.local.get('supabase_auth_token');

                if (!supabase_auth_token) {
                    console.warn("⚠️ User not logged in to Nexus.");
                    return;
                }

                const response = await fetch(SERVER_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "Authorization": `Bearer ${supabase_auth_token}`
                    },
                    body: rawTextToSend
                });

                if (response.status === 202) {
                    // Queued - start polling
                    const { jobId } = await response.json();
                    console.log(`📋 Nexus: Job queued (ID: ${jobId}). Tracking progress...`);

                    await window.pollJobStatus(jobId);
                } else if (response.status === 200) {
                    console.log("✅ Nexus: Saved successfully!");
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error("❌ Nexus Error:", response.status, errorData.error);
                }

            } catch (error) {
                console.error("❌ Nexus Connection Failed:", error);
            }
        };
    }

} // <--- FIXED: Closing brace for the main 'NEXUS_CONTENT_LOADED' check

// Run extraction when page is loaded
// Wait a bit for dynamic content to load
setTimeout(() => {
    if (typeof window.extractContent === 'function') {
        window.extractContent();
    } else {
        console.error("Nexus: extractContent function not found!");
    }
}, 1000);