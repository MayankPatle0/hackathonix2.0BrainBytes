
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// --- ENVIRONMENT VALIDATION ---
// Note: Groq API keys are validated by apiKeyRotation.js (supports multiple formats)
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// --- JOB PRIORITIES ---
const PRIORITIES = {
    CRITICAL: 1,  // User manually saving
    HIGH: 2,      // Mobile app shares
    NORMAL: 3,    // Extension captures
    LOW: 4        // Batch imports
};

// --- HELPER FUNCTIONS ---
function getContentHash(text) {
    return crypto.createHash('md5').update(text.substring(0, 500)).digest('hex');
}

// --- INITIALIZE CLIENTS ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// MULTI-KEY ROTATION SYSTEM
import { getRotationManager, callGroqWithRotation, getAPIKeyStats } from './apiKeyRotation.js';
const groqRotation = getRotationManager(); // Initialize rotation manager
// Note: Individual groq client created per request via rotation

// --- SETUP QUEUE (PRODUCER) ---
// This connects to Redis to push jobs
const connection = new IORedis(REDIS_URL, { 
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        console.error('Redis connection error:', err.message);
        return true;
    }
});

const analysisQueue = new Queue('nexus-ai-queue', { connection });
const failedQueue = new Queue('nexus-failed-queue', { connection }); // Dead Letter Queue

// --- REDIS CONNECTION HANDLERS ---
connection.on('connect', () => console.log('✅ Redis connected'));
connection.on('error', (err) => console.error('❌ Redis error:', err.message));
connection.on('close', () => console.warn('⚠️  Redis connection closed'));

const app = express();

// --- RATE LIMITING CONFIGURATION ---
// Simple in-memory rate limiting (for deployment, use Redis-based rate limiting)
const userRequestCounts = new Map();

// Rate limiter middleware
const rateLimitMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No authorization token' });
    }
    
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 20; // 20 requests per minute per user
    
    // Get or initialize user's request log
    if (!userRequestCounts.has(token)) {
        userRequestCounts.set(token, []);
    }
    
    const requests = userRequestCounts.get(token);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Free tier limit: 20 memories per minute.',
            retryAfter: 60,
            limit: maxRequests,
            windowMs
        });
    }
    
    // Add current request
    recentRequests.push(now);
    userRequestCounts.set(token, recentRequests);
    
    // Cleanup old entries periodically (prevent memory leak)
    if (userRequestCounts.size > 1000) {
        const cutoff = now - windowMs;
        for (const [key, times] of userRequestCounts.entries()) {
            if (times.length === 0 || Math.max(...times) < cutoff) {
                userRequestCounts.delete(key);
            }
        }
    }
    
    next();
};

// --- CORS CONFIGURATION ---
// Allow Chrome extensions and web frontend
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) return callback(null, true);
        
        // Chrome extensions use chrome-extension:// protocol
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        
        // Allowed web origins
        const allowedOrigins = [
            'http://localhost:3000',           // Local development (Frontend)
            'http://localhost:5173',           // Vite dev server
            'http://localhost:5174',           // Vite alternative port
            'https://complete-nexus.vercel.app', // Production web frontend
            'https://www.youtube.com',         // YouTube (for extension)
            'https://youtube.com',
            'https://twitter.com',             // Twitter/X (for extension)
            'https://x.com',
            'https://www.instagram.com',       // Instagram (for extension)
            'https://instagram.com',
            'https://www.linkedin.com',        // LinkedIn (for extension)
            'https://linkedin.com',
            'https://www.reddit.com',          // Reddit (for extension)
            'https://reddit.com',
        ];
        
        // Check if origin is in allowed list or is a subdomain of allowed domains
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            return origin === allowedOrigin || origin.endsWith(allowedOrigin.replace('https://', ''));
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[API] ⚠️ Blocked CORS request from: ${origin}`);
            callback(null, true); // Allow anyway for now (change to false in production for strict mode)
        }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));
app.use('/receive_data', express.text({ type: '*/*', limit: '10mb' }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

console.log("⚡ Nexus Server (Groq + BullMQ) Ready");

// --- 1. ASYNC MEMORY SAVING (High Throughput) ---
app.post('/receive_data', rateLimitMiddleware, async (req, res) => {
    const rawText = req.body;
    // Source: 'M' = Mobile, 'E' = Extension/Web
    const source = req.query.source || 'E'; 
    
    if (!rawText || rawText.length < 2) {
        return res.status(400).json({ error: "Insufficient text data." });
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "No authorization token provided." });

        // Determine job priority (Mobile = higher priority)
        const priority = source === 'M' ? 1 : 2;
        
        // Add job to queue with retry logic and timeout
        const job = await analysisQueue.add('analyze_memory', {
            rawText,
            token, // Pass token so worker can save to DB on behalf of user
            source // Pass source to worker to save in metadata
        }, {
            priority,
            attempts: 3, // Retry failed jobs 3 times
            backoff: {
                type: 'exponential',
                delay: 2000 // Start at 2s, then 4s, 8s
            },
            timeout: 30000, // Kill job after 30 seconds
            removeOnComplete: 1000, // Keep history of last 1000 jobs
            removeOnFail: 5000
        });

        console.log(`[Queue] Job ${job.id} added. Source: ${source}`);

        // Return 202 Accepted with Job ID
        res.status(202).json({ 
            message: "Processing started", 
            jobId: job.id,
            state: 'queued' 
        });

    } catch (error) {
        console.error("Queue Error:", error);
        
        // Provide specific error messages
        let errorMessage = "Failed to queue job";
        let statusCode = 500;
        let retryable = false;
        
        if (error.message?.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
            errorMessage = "Queue service unavailable. Please try again later.";
            statusCode = 503;
            retryable = true;
        } else if (error.message?.includes('timeout')) {
            errorMessage = "Request timed out. Please try again.";
            statusCode = 504;
            retryable = true;
        } else if (error.message?.includes('ETIMEDOUT')) {
            errorMessage = "Connection to queue service timed out.";
            statusCode = 503;
            retryable = true;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage, 
            retryable,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// --- 2. JOB STATUS POLLING ---
app.get('/jobs/:id', async (req, res) => {
    try {
        const job = await analysisQueue.getJob(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const state = await job.getState();
        const result = job.returnvalue;
        const reason = job.failedReason;

        res.json({ jobId: job.id, state, result, reason });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 3. SYNC CHAT (Using Groq Directly for Speed) ---
app.post('/ask_nexus', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    try {
        // 1. Fetch recent context from DB
        const { data: memories } = await supabase
            .from('retain_auth_memory')
            .select('metadata')
            .order('created_at', { ascending: false })
            .limit(10);

        const context = memories?.map(m => 
            `- ${m.metadata.title}: ${m.metadata.summary}`
        ).join('\n') || "No memories found.";

        // 2. Call Groq LLaMA
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "You are Nexus, a personal memory assistant. Answer based on the provided context." },
                { role: 'user', content: `Context:\n${context}\n\nUser Question: ${query}` }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
        });

        res.json({ answer: completion.choices[0].message.content });
    } catch (e) {
        console.error("Chat Error:", e);
        res.status(500).json({ error: "AI Brain offline" });
    }
});

// --- 4. NLP SEARCH (Groq to SQL) ---
app.post('/searchNLPSql', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });

    const systemPrompt = `You are a SQL generator for PostgreSQL. 
    Table: retain_auth_memory (id, created_at, metadata jsonb).
    Metadata fields: title, summary, emotions (array), keywords (array).
    Return ONLY the raw SQL query to select IDs. No markdown.
    Example: SELECT id FROM retain_auth_memory WHERE metadata->>'title' ILIKE '%cat%'`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1
        });

        const sql = completion.choices[0].message.content.replace(/```sql|```/g, '').trim();
        console.log("Generated SQL:", sql);

        const { data, error } = await supabase.rpc('execute_sql', { query_string: sql });
        
        if (error) throw error;
        res.json({ ids: data.map(r => r.id) });

    } catch (e) {
        console.error("Search Error:", e);
        res.status(500).json({ error: "Search failed" });
    }
});

// --- 5. IMAGE SEARCH STUB ---
app.post('/searchByImage', upload.single('image'), async (req, res) => {
    res.status(501).json({ error: "Image search not available with Groq yet." });
});

// --- 6. HEALTH CHECK ENDPOINT ---
app.get('/health', async (req, res) => {
    try {
        // Check Redis connection
        await connection.ping();
        
        // Get queue metrics
        const [waiting, active, failed, completed] = await Promise.all([
            analysisQueue.getWaitingCount(),
            analysisQueue.getActiveCount(),
            analysisQueue.getFailedCount(),
            analysisQueue.getCompletedCount()
        ]);
        
        res.json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            redis: 'connected',
            queue: { 
                waiting, 
                active, 
                failed, 
                completed 
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// --- 7. QUEUE METRICS ENDPOINT (OPTIONAL) ---
app.get('/metrics', async (req, res) => {
    try {
        const jobCounts = await analysisQueue.getJobCounts();
        const workers = await analysisQueue.getWorkers();
        
        res.json({
            queue: 'nexus-ai-queue',
            jobs: jobCounts,
            workers: workers.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Nexus Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
    
    try {
        // Close queue connections
        await analysisQueue.close();
        await failedQueue.close();
        console.log('✅ Queue connections closed');
        
        // Close Redis connection
        await connection.quit();
        console.log('✅ Redis connection closed');
        
        console.log('👋 Graceful shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
});
