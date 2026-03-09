import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'; // --- NEW: Import Supabase ---

// Load environment variables from .env file
dotenv.config();

// --- Initialize Groq Client ---
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// --- NEW: Initialize Supabase Client ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


// --- Initialize Express App ---
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.text({ type: '*/*', limit: '10mb' }));


// --- Main Route to Receive, Process, and Save Data ---
app.post('/receive_data', async (req, res) => {
    const rawText = req.body;
    console.log("Received raw text data...");

    if (!rawText || rawText.length < 20) {
        return res.status(400).json({ error: "Insufficient text data received." });
    }

    const todaysTimestamp = new Date().toISOString();

    const systemPrompt = `
        You are an expert data analysis engine. Your task is to analyze raw text from a website and extract specific information.
        The output MUST be a valid JSON object. Do not include any extra text or explanations, as your output will be parsed directly.
        
        The JSON object must have these exact keys:
        - "title": A concise title for the content.
        - "summary": A brief summary of the content (2-3 sentences).
        - "keywords": An array of 3-5 relevant string keywords.
        - "emotions": An array of 1-3 primary emotions or tones (e.g., "Informative", "Urgent", "Positive").
        - "timestamp": If a timestamp is present, extract it as an ISO 8601 string. If not, use this timestamp: ${todaysTimestamp}.
        - "source_url": The primary URL or link of the post/article found within the raw text. If no specific link is found, return null.
    `;

    try {
        console.log("Sending data to Groq for analysis...");
        
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Here is the raw text to analyze:\n---\n${rawText}\n---` }
            ],
            model: "llama-3.1-8b-instant", // Make sure this is a current, working model from your Groq dashboard
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        console.log("Received response from Groq.");

        const jsonResponseText = completion.choices[0].message.content;
        const structuredData = JSON.parse(jsonResponseText);
        console.log("Successfully parsed structured data:", structuredData); // This "prints" the output

// analuz
if(structured)

        // --- NEW: Save to Supabase ---
        console.log("Attempting to save data to Supabase...");
        const { data: dbData, error: dbError } = await supabase
            .from('content_documents')
            .insert([
                { metadata: structuredData } // Insert the entire JSON object into the 'metadata' column
            ])
            .select();

        if (dbError) {
            console.error("Supabase insert error:", dbError);
            throw new Error(`Failed to save data to database: ${dbError.message}`);
        }
        
        console.log("Successfully saved data to Supabase.");
        // --- End of new Supabase block ---

        res.status(200).json(structuredData);

    } catch (error) {
        console.error("An error occurred in the process:", error);
        res.status(500).json({ error: "Failed to process and save data." });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});