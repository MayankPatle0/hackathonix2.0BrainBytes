import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from the .env file colocated with this server file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Ensure it is set in backend/.env or your environment.');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY. Ensure they are set in backend/.env.');
}

// --- Initialize OpenAI Client ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Initialize Supabase Client ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


// --- Initialize Express App ---
const app = express();
const port = 3001; // Use a different port from your frontend if needed

// --- Middleware ---
app.use(cors());
// This is crucial: it tells Express to expect raw text, not JSON
app.use(express.text({ type: '*/*', limit: '10mb' }));


// --- Main Route to Receive and Process Data ---
app.post('/receive_data', async (req, res) => {
    // req.body will contain the raw text sent from your extension
    const rawText = req.body;
    console.log("Received raw text data...",rawText);

    if (!rawText || rawText.length < 20) {
        return res.status(400).json({ error: "Insufficient text data received." });
    }

    // Get today's date for the timestamp if none is found
    const todaysTimestamp = new Date().toISOString();

    // --- Build messages for OpenAI ---
    const systemPrompt = `
        You are an expert data analysis engine. Your task is to analyze raw text from a website and extract specific information.
        The output MUST be a valid JSON object and nothing else. Do not include any explanatory text before or after the JSON.

        The JSON object must have these exact keys:
        - "title": A concise title for the content.
        - "summary": A brief summary of the content (2-3 sentences).
        - "keywords": An array of 3-5 relevant string keywords.
        - "emotions": An array of 1-3 primary emotions or tones conveyed by the text (e.g., "Informative", "Urgent", "Positive", "Analytical").
        - "timestamp": If a timestamp is present in the text, extract and format it as an ISO 8601 string. If no timestamp is found, use this timestamp: ${todaysTimestamp}.
        - "source_url": The primary URL of the article/post or main resource referenced in the text. If none is found, return null.
    `;

    const userPrompt = `
        Here is the raw text to analyze:\n---\n${rawText}\n---
    `;

    try {
        console.log("Sending data to OpenAI for analysis...");
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });

        console.log("Received response from OpenAI.");

        let jsonResponseText = completion.choices[0].message.content || '';

        // Clean the response to ensure it's valid JSON if fenced
        if (jsonResponseText.startsWith("```")) {
            jsonResponseText = jsonResponseText
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
        }

        const structuredData = JSON.parse(jsonResponseText);
        console.log("Successfully parsed structured data.");

        // Extract URLs and media URLs from the raw text as a fallback/augmentation
        const extractAllUrls = (text) => (text.match(/https?:\/\/[^\s<>"')]+/gi) || []);
        const mediaExt = /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg|\.mp4|\.webm|\.mov|\.avi|\.mkv|\.m4v|\.gifv)(?:[?#].*)?$/i;
        const videoDomains = /(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|dailymotion\.com\/|instagram\.com\/reel\/|instagram\.com\/p\/)/i;
        const imageDomains = /(images\.|cdn\.|i\.imgur\.com|imgur\.com\/|unsplash\.com\/|picsum\.photos\/)/i;
        const isMedia = (u) => mediaExt.test(u) || videoDomains.test(u) || imageDomains.test(u);
        const extractMediaUrls = (text) => extractAllUrls(text).filter(isMedia);
        const extractSourceUrl = (text) => {
            const urls = extractAllUrls(text);
            for (const u of urls) {
                if (!isMedia(u)) return u;
            }
            return null;
        };

        const detectedMedia = extractMediaUrls(rawText);
        const detectedSource = extractSourceUrl(rawText);

        // Merge AI-provided media_urls (if any) with detected URLs
        const aiMedia = Array.isArray(structuredData.media_urls) ? structuredData.media_urls : [];
        const merged = [...aiMedia, ...detectedMedia];
        const mergedUniq = Array.from(new Set(merged));
        structuredData.media_urls = mergedUniq;

        // Ensure source_url exists and is a string, fallback to detected
        if (typeof structuredData.source_url !== 'string' || !structuredData.source_url.trim()) {
            structuredData.source_url = detectedSource || null;
        }

        // Print the AI result (excluding media URLs) to the terminal for visibility
        const logData = { ...structuredData };
        delete logData.media_urls;
        console.log("AI structured result:\n" + JSON.stringify(logData, null, 2));

        // --- Save to Supabase Database ---
        console.log("Attempting to save data to Supabase...");
        
        // Create a copy of structured data without media URLs for database storage
        const dataForDatabase = { ...structuredData };
        delete dataForDatabase.media_urls; // Remove media URLs from database save
        
        const { data: dbData, error: dbError } = await supabase
            .from('content_documents')
            .insert([
                { metadata: dataForDatabase } // Insert data WITHOUT media URLs
            ])
            .select();

        if (dbError) {
            console.error("Supabase insert error:", dbError);
            // Continue execution - don't fail the request if DB save fails
            console.log("Warning: Data was processed successfully but could not be saved to database.");
        } else {
            console.log("Successfully saved data to Supabase with ID:", dbData[0]?.id);
        }
        // --- End of Supabase save block ---

        // Send the clean, structured JSON back
        res.status(200).json(structuredData);

    } catch (error) {
        console.error("Error communicating with OpenAI or parsing response:", error);
        res.status(500).json({ error: "Failed to process data with the AI model." });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});