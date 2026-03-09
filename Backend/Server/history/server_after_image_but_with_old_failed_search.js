import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer'; // Import multer

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// --- Initialize Clients ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- Initialize Express App ---
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
// This middleware is for your existing /receive_data route
app.use('/receive_data', express.text({ type: '*/*', limit: '10mb' }));
// This middleware is for parsing JSON in other routes if needed
app.use(express.json());

// --- Multer Configuration for Image Upload ---
// We'll store the image in memory as a buffer.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// === YOUR EXISTING ROUTE (Unchanged) ===
app.post('/receive_data', async (req, res) => {
    // ... your existing logic for handling raw text ...
    // This route remains fully functional.
});


// === NEW ROUTE: /searchByImage ===
app.post('/searchByImage', upload.single('image'), async (req, res) => {
    console.log("Received image for analysis...");

    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
        // 1. Convert the image buffer to a base64 string for the API
        const base64Image = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        // 2. Ask OpenAI's vision model to describe the image with keywords
        console.log("Sending image to OpenAI for keyword extraction...");
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyze this image and provide 3 to 5 keywords that describe its main subjects, themes, or objects. Return only the keywords as a single, space-separated string. For example: "cat sitting window sill".' },
                        { type: 'image_url', image_url: { url: dataUrl } },
                    ],
                },
            ],
        });

        const keywords = response.choices[0].message.content;
        if (!keywords) {
            throw new Error("AI did not return any keywords.");
        }
        console.log(`OpenAI identified keywords: "${keywords}"`);

        // 3. Use the keywords to perform a full-text search on your database
        console.log("Searching database with identified keywords...");
        const { data, error } = await supabase
            .from('content_documents')
            .select('id')
            .textSearch('fts', keywords.split(' ').join(' | '), { // Format keywords for search
                type: 'websearch',
                config: 'simple'
            });
        
        if (error) {
            throw error;
        }

        // 4. Return the IDs of the matching memory cards
        const matchingIds = data.map(item => String(item.id));
        console.log(`Found ${matchingIds.length} matching documents.`);
        
        res.status(200).json({
            keywords: keywords.split(' '),
            ids: matchingIds
        });

    } catch (error) {
        console.error("Error during image search:", error);
        res.status(500).json({ error: 'Failed to perform image search.' });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});