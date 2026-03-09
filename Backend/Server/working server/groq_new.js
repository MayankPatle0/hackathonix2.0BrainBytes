import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk'; // Use Groq SDK
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// --- Initialize Clients ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Initialize Groq
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- Initialize Express App ---
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
// Middleware specifically for the /receive_data route to handle raw text
app.use('/receive_data', express.text({ type: '*/*', limit: '10mb' }));
// General JSON middleware for other routes if needed
app.use(express.json());

// Multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// === ROUTE 1: /receive_data (Now using Groq) ===
app.post('/receive_data', async (req, res) => {
    const rawText = req.body;
    console.log("Received raw text data...");

    if (!rawText || rawText.length < 20) {
        return res.status(400).json({ error: "Insufficient text data received." });
    }

    const todaysTimestamp = new Date().toISOString();
    const systemPrompt = `
        You are an expert data analysis engine. Your task is to analyze raw text and extract specific information.
        The output MUST be a valid JSON object and nothing else.
        The JSON object must have these keys: "title", "summary", "keywords" (an array), "emotions" (an array),
        "timestamp" (use ${todaysTimestamp} if none is found), and "source_url" (return null if not found).
    `;

    try {
        // taking token from header aur use verify krta as authenticates
        const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided." });
    }

    // --- 2. Verify token and get user ---
    // We use the ANON client just to verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
     // --- 3. Create a NEW Supabase client *authenticated as the user* ---
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    // --- This new client will pass the RLS checks ---


        console.log("Sending data to Groq for analysis...");
        // --- Use Groq API ---
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Use a valid Groq model (check Groq console)
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze this text:\n---\n${rawText}\n---` }
            ]
        });

        const jsonResponseText = completion.choices[0].message.content || '{}';
        const structuredData = JSON.parse(jsonResponseText);
        console.log("Successfully parsed structured data from Groq.");

        // --- Save to Supabase ---
        console.log("Saving to Supabase...");
        const { error: dbError } = await userSupabase
            .from('retain_auth_memory')
            .insert([{ metadata: structuredData }]);

        if (dbError) throw dbError;

        console.log("Successfully saved data to Supabase.");
        res.status(200).json(structuredData);

    } catch (error) {
        console.error("Error in /receive_data route:", error);
        res.status(500).json({ error: "Failed to process data with Groq." });
    }
});

app.post('/searchNLPSql', async(req,res)=>{
    
const systemPrompt = `You are an expert PostgreSQL query generator. Your sole purpose is to convert natural language queries into a single, executable SQL query for a Supabase database.

**RULES:**
1.  You MUST output *only* the raw SQL query. No other text, explanations, or markdown.
2.  The query will ALWAYS be on the \`public.retain_auth_memory\` table.
3.  Assume the current time for any date calculations is \`NOW()\`.

**TABLE SCHEMA:**
-   Table: \`public.retain_auth_memory\`
-   Columns:
    -   \`id\` (BIGINT)
    -   \`created_at\` (TIMESTAMPTZ): Use for all date/time filters.
    -   \`favourite\` (BOOLEAN): Use for "favourite" or "bookmarked" items.
    -   \`fts\` (TSVECTOR): Use for all general full-text search (e.g., "AI", "bootcamp", "development").
    -   \`metadata\` (JSONB): A JSON object with the following structure:
        -   \`title\` (TEXT)
        -   \`summary\` (TEXT)
        -   \`emotions\` (ARRAY OF TEXT)
        -   \`keywords\` (ARRAY OF TEXT)
        -   \`source_url\` (TEXT)

**QUERY LOGIC & EXAMPLES:**

1.  **General Search (FTS):** For general text search on content.
    -   *User Query:* "stuff about AI and GitHub"
    -   *SQL:* \`WHERE fts @@ plainto_tsquery('english', 'AI and GitHub')\`

2.  **Date/Time Filtering (TIMESTAMPTZ):** Use \`created_at\` and \`INTERVAL\`.
    -   *User Query:* "from the last 7 days"
    -   *SQL:* \`WHERE created_at >= NOW() - INTERVAL '7 days'\`
    -   *User Query:* "in October 2025"
    -   *SQL:* \`WHERE created_at >= '2025-10-01' AND created_at < '2025-11-01'\`

3.  **JSONB Array Search (Emotions/Keywords):** Use the \`@>\` (contains) operator. The value MUST be a JSONB array.
    -   *User Query:* "with 'Positive' emotion"
    -   *SQL:* \`WHERE metadata -> 'emotions' @> '["Positive"]'::jsonb\`
    -   *User Query:* "with 'AI' and 'Web' keywords"
    -   *SQL:* \`WHERE metadata -> 'keywords' @> '["AI", "Web"]'::jsonb\`

4.  **JSONB Text Field Search (Source/Title):** Use the \`->>\` operator and \`ILIKE\`.
    -   *User Query:* "from youtube"
    -   *SQL:* \`WHERE metadata ->> 'source_url' ILIKE '%youtube.com%'\`
    -   *User Query:* "title contains 'Copilot'"
    -   *SQL:* \`WHERE metadata ->> 'title' ILIKE '%Copilot%'\`

5.  **Boolean Search (Favourite):**
    -   *User Query:* "show my favourites"
    -   *SQL:* \`WHERE favourite = true\`

6.  **Full-Text Search (OR logic):** For searches with "or".
    -   *User Query:* "data on AI or GitHub"
    -   *SQL:* \`WHERE fts @@ to_tsquery('english', 'AI | GitHub')\`

7.  **Descriptive Word Search (Broad):**
    -   *Note:* When a user searches for a descriptive word (like "urgent", "positive", "informative", "crypto"), it could be in the \`title\`, \`keywords\`, or \`emotions\`.
    -   The \`fts\` column is the best way to search \`title\`, \`summary\`, and \`keywords\` at once.
    -   The \`emotions\` array stores adjectives with the **first letter capitalized** (e.g., "Urgent", "Positive"). You must search this array *in addition* to \`fts\`.
    -   **Crucial Rule:** You must capitalize the descriptive word when checking the \`emotions\` array.

    -   *User Query:* "show me urgent data from last month"
    -   *SQL:* \`WHERE (fts @@ plainto_tsquery('english', 'urgent') OR metadata -> 'emotions' @> '["Urgent"]'::jsonb) AND created_at >= NOW() - INTERVAL '1 month'\`

    -   *User Query:* "find informative or positive documents"
    -   *SQL:* \`WHERE (fts @@ to_tsquery('english', 'informative | positive') OR metadata -> 'emotions' @> '["Informative"]'::jsonb OR metadata -> 'emotions' @> '["Positive"]'::jsonb)\`

**OUTPUT:**
-   Always select \`id\`, \`created_at\`, and \`metadata\`.
-   Your query must start with \`SELECT id, created_at, metadata FROM public.retain_auth_memory WHERE ...\`
-   If no filters match, just output \`SELECT id, created_at, metadata FROM public.retain_auth_memory;\`

The user's request will follow. Generate ONLY the SQL query.`;

try {
        // 1. Get the user's query from the request body
        const userQuery = req.body.query;
        if (!userQuery) {
            return res.status(400).json({ error: 'No query provided' });
        }

        console.log("Got query from client:", userQuery);

        // 2. Call Groq (this is your original code)
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `here is the nlp query to process:- ${userQuery}` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
        
        });

        const sqlQuery = completion.choices[0].message.content;
        console.log("Generated SQL:", sqlQuery);

        // Call the 'execute_sql' function
        const { data: results, error: dbError } = await supabase.rpc('execute_sql', { query_string: sqlQuery });

        if (dbError) {
            console.error("Supabase query execution error:", dbError);
            // Handle specific errors
            if (dbError.code === '42601') { // Syntax error
                return res.status(400).json({ error: `AI generated invalid SQL: ${dbError.message}` });
            }
            if (dbError.code === 'P0001' && dbError.message.includes('Invalid or disallowed query')) { // Custom error
                return res.status(403).json({ error: `Execution denied: ${dbError.message}` });
            }
            // Generic error
            return res.status(500).json({ error: `Database query failed: ${dbError.message}` });
        }
        
        // --- 4. Print results to server console ---
        console.log("Successfully executed query. Results received:");
        console.log(JSON.stringify(results, null, 2)); // Pretty-print the JSON results
        console.log("Rows found:", results?.length || 0);

        // --- 5. Send the results back to the client ---
        // The results from the 'execute_sql' function are already in the correct format (array of json)
       // --- 4. Send the results (IDs only) back to the client ---
        // Ensure results are mapped correctly, extracting the id from each row object
        const finalIds = results ? results.map(row => String(row.id)) : [];
        res.json({ ids: finalIds }); // Return { ids: [...] }  

    } catch (e) {
        console.error("Error on server:", e);
        res.status(500).json({ error: 'Server error' });
    }
})


// === ROUTE 2: /searchByImage (Cannot use Groq for image analysis) ===
app.post('/searchByImage', upload.single('image'), async (req, res) => {
    console.log("Received image upload attempt...");

    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // --- Groq Limitation ---
    console.error("Groq API does not support image analysis. Returning empty results.");
    res.status(501).json({
        error: 'Image analysis is not supported with the current AI provider (Groq).',
        keywords: [],
        ids: []
    });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});