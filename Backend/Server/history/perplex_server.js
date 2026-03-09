import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

    // --- The System Prompt for Perplexity ---
    const systemPrompt = `
        You are an expert data analysis engine. Your task is to analyze the following raw text content from a website and extract specific information.
        The output MUST be a valid JSON object and nothing else. Do not include any explanatory text, markdown formatting, or code block syntax before or after the JSON.
        
        The JSON object must have these exact keys:
        - "title": A concise title for the content.
        - "summary": A brief summary of the content (2-3 sentences).
        - "keywords": An array of 3-5 relevant string keywords.
        - "emotions": An array of 1-3 primary emotions or tones conveyed by the text (e.g., "Informative", "Urgent", "Positive", "Analytical").
        - "timestamp": If a timestamp is present in the text, extract and format it as an ISO 8601 string. If no timestamp is found, use this timestamp: ${todaysTimestamp}.
    `;
    
    // The user's content goes into the user prompt
    const userPrompt = `
        Here is the raw text to analyze:
        ---
        ${rawText}
        ---
    `;

    try {
        console.log("Sending data to Perplexity for analysis...");
        
        // --- Make the fetch call to the Perplexity API ---
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3-8b-instruct', // A powerful and reliable model for this task
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Received response from Perplexity.");

        // --- Extract and clean the response text ---
        let jsonResponseText = result.choices[0].message.content;
        
        if (jsonResponseText.startsWith("```json")) {
            jsonResponseText = jsonResponseText.substring(7, jsonResponseText.length - 3).trim();
        }

        const structuredData = JSON.parse(jsonResponseText);
        console.log("Successfully parsed structured data.");

        res.status(200).json(structuredData);

    } catch (error) {
        console.error("Error communicating with Perplexity or parsing response:", error);
        res.status(500).json({ error: "Failed to process data with the AI model." });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});