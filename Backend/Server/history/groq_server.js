import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// --- Initialize Groq Client ---
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// --- Initialize Express App ---
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.text({ type: '*/*', limit: '10mb' }));


// --- Main Route to Receive and Process Data ---
app.post('/receive_data', async (req, res) => {
    const rawText = req.body;
    console.log("Received raw text data...");

    if (!rawText || rawText.length < 20) {
        return res.status(400).json({ error: "Insufficient text data received." });
    }

    const todaysTimestamp = new Date().toISOString();

    // --- The System Prompt for Groq ---
// --- The System Prompt for Groq ---
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
        
        // --- Make the API call to Groq ---
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Here is the raw text to analyze:\n---\n${rawText}\n---`
                }
            ],
        model: "llama-3.1-8b-instant",
 // A powerful and current model on Groq // A fast and powerful Llama 3 model// A fast and capable model for this task
            temperature: 0.2,
            // This is a powerful feature that forces the output to be valid JSON
            response_format: { type: 'json_object' }
        });

        console.log("Received response from Groq.");

        // Extract the JSON string from the response
        const jsonResponseText = completion.choices[0].message.content;

        // Parse the JSON string into an object
        const structuredData = JSON.parse(jsonResponseText);
        console.log("Successfully parsed structured data.");

        res.status(200).json(structuredData);

    } catch (error) {
        console.error("Error communicating with Groq or parsing response:", error);
        res.status(500).json({ error: "Failed to process data with the AI model." });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});