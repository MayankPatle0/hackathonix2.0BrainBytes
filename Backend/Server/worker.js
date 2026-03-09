
import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import IORedis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- OPTIMIZED API KEY ROTATION MANAGER (Production-Grade) ---
class GroqClientManager {
    constructor() {
        let keys = [];
        
        if (process.env.GROQ_API_KEYS) {
            keys = process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(k => k.length > 0);
        } else if (process.env.GROQ_API_KEY) {
            keys = [process.env.GROQ_API_KEY];
        }

        if (keys.length === 0) {
            throw new Error("❌ CRITICAL: No GROQ_API_KEYS configured! Add keys to .env");
        }

        // Initialize with comprehensive metrics
        this.clients = keys.map((key, index) => ({
            client: new Groq({ apiKey: key }),
            keyId: `Key-${index + 1}`,
            keyMask: key.substring(0, 8) + "...",
            lastUsed: 0,
            rateLimitedUntil: 0,
            consecutiveFailures: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitHits: 0
        }));
        
        this.currentIndex = 0;
        this.totalRequestsOverall = 0;
        console.log(`🔑 Production Mode: Loaded ${this.clients.length} Groq API Keys`);
        console.log(`📊 Theoretical Capacity: ${this.clients.length * 30} requests/minute`);
    }

    getClient() {
        const now = Date.now();
        
        // 1. Try to find a healthy client (Round Robin with health score)
        for (let i = 0; i < this.clients.length; i++) {
            const ptr = (this.currentIndex + i) % this.clients.length;
            const candidate = this.clients[ptr];

            // Skip if rate limited
            if (candidate.rateLimitedUntil >= now) continue;

            // Exponential backoff for consecutive failures
            const backoffTime = Math.min(1000 * Math.pow(2, candidate.consecutiveFailures), 30000);
            if (now - candidate.lastUsed < backoffTime) continue;

            // Select this key
            this.currentIndex = (ptr + 1) % this.clients.length;
            candidate.lastUsed = now;
            candidate.totalRequests++;
            this.totalRequestsOverall++;
            
            return { groq: candidate.client, id: ptr, keyId: candidate.keyId };
        }

        // 2. All blocked? Return least-recently rate-limited (emergency fallback)
        console.warn("⚠️ All keys blocked! Using emergency fallback...");
        const fallback = this.clients.reduce((min, curr) => 
            curr.rateLimitedUntil < min.rateLimitedUntil ? curr : min
        );
        const fallbackId = this.clients.indexOf(fallback);
        return { groq: fallback.client, id: fallbackId, keyId: fallback.keyId };
    }

    reportSuccess(id) {
        if (this.clients[id]) {
            this.clients[id].successfulRequests++;
            this.clients[id].consecutiveFailures = 0; // Reset failure counter
        }
    }

    reportFailure(id, isRateLimit = false) {
        if (this.clients[id]) {
            this.clients[id].failedRequests++;
            this.clients[id].consecutiveFailures++;
            
            if (isRateLimit) {
                this.clients[id].rateLimitHits++;
                this.clients[id].rateLimitedUntil = Date.now() + 60000;
                console.warn(`⏳ ${this.clients[id].keyId} rate limited. Cooldown: 60s`);
            }
        }
    }

    getHealthMetrics() {
        return {
            totalKeys: this.clients.length,
            totalRequests: this.totalRequestsOverall,
            theoreticalCapacity: `${this.clients.length * 30} req/min`,
            keys: this.clients.map(c => ({
                id: c.keyId,
                mask: c.keyMask,
                status: c.rateLimitedUntil > Date.now() ? 'RATE_LIMITED' : 'HEALTHY',
                total: c.totalRequests,
                success: c.successfulRequests,
                failed: c.failedRequests,
                rateLimitHits: c.rateLimitHits,
                successRate: c.totalRequests > 0 ? `${((c.successfulRequests / c.totalRequests) * 100).toFixed(1)}%` : 'N/A'
            }))
        };
    }
}

const groqManager = new GroqClientManager();

console.log("👷 Nexus Worker Started. Waiting for jobs...");

const connection = new IORedis(REDIS_URL, { 
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        console.error('Worker Redis connection error:', err.message);
        return true;
    }
});

// --- REDIS CONNECTION HANDLERS ---
connection.on('connect', () => console.log('✅ Worker Redis connected'));
connection.on('error', (err) => console.error('❌ Worker Redis error:', err.message));
connection.on('close', () => console.warn('⚠️  Worker Redis connection closed'));

const worker = new Worker('nexus-ai-queue', async (job) => {
    const { rawText, token, source } = job.data; // Extract source
    console.log(`[Worker] Processing Job ${job.id} (Source: ${source || 'W'})...`);

    // Get a rotated client
    const { groq: currentGroq, id: clientId } = groqManager.getClient();

    try {
        // 1. Analyze with Groq (Llama 3)
        const completion = await currentGroq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Analyze the text. Return valid JSON with: 
                    title, summary, keywords (array), emotions (array), source_url (string or null).`
                },
                {
                    role: "user",
                    content: rawText
                }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        result.timestamp = new Date().toISOString();
        result.source = source || 'W'; // Save source in metadata ('M' or 'W')

        // 2. Save to Supabase using User Token (RLS)
        // We create a scoped client for this specific user request
        const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userSupabase
            .from('retain_auth_memory')
            .insert([{ metadata: result }])
            .select();

        if (error) throw new Error(error.message);

        console.log(`[Worker] Job ${job.id} Completed. Memory ID: ${data[0].id}`);
        groqManager.reportSuccess(clientId); // Track successful API call
        return { ...result, id: data[0].id };

    } catch (err) {
        console.error(`[Worker] Job ${job.id} Failed (Attempt ${job.attemptsMade}):`, err.message);
        
        // Handle Rate Limits (429) specifically
        const isRateLimit = err.message.includes('429') || err.message.includes('rate limit') || err.message.toLowerCase().includes('rate_limit_exceeded');
        
        if (isRateLimit) {
            groqManager.reportFailure(clientId, true); // Mark as rate limit
            throw new Error('Rate limit hit - Retrying with next key');
        }

        // Report other failures
        groqManager.reportFailure(clientId, false);

        // Provide detailed error information for debugging
        const errorInfo = {
            message: err.message,
            jobId: job.id,
            attempt: job.attemptsMade,
            maxAttempts: job.opts?.attempts || 1
        };
        
        // If this is a token error, don't retry
        if (err.message.includes('JWT') || err.message.includes('auth')) {
            errorInfo.retryable = false;
            console.error(`[Worker] Authentication error - job will not be retried`);
        }
        
        throw err; // Let BullMQ handle retries
    }

}, { 
    connection, 
    concurrency: 10, // OPTIMIZED: 5 keys = 150 RPM capacity, 10 concurrent = safe
    limiter: {
        max: 150, // OPTIMIZED: 5 keys × 30 RPM/key = 150 total capacity
        duration: 60000 
    }
});

// --- CIRCUIT BREAKER PATTERN ---
let consecutiveFailures = 0;
const MAX_FAILURES = 10;
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000; // 5 minutes

function tripCircuitBreaker() {
    console.error(`⚠️  CIRCUIT BREAKER TRIPPED! ${consecutiveFailures} consecutive failures`);
    console.log('⏸️  Pausing worker for 5 minutes...');
    worker.pause();
    
    setTimeout(() => {
        console.log('🔄 Circuit breaker reset. Resuming worker...');
        consecutiveFailures = 0;
        worker.resume();
    }, CIRCUIT_BREAKER_RESET_TIME);
}


// --- WORKER EVENT HANDLERS FOR MONITORING ---
worker.on('completed', (job, result) => {
    const duration = Date.now() - job.timestamp;
    console.log(`✅ [Worker] Job ${job.id} completed in ${duration}ms. Memory ID: ${result.id}`);
    
    // Reset circuit breaker on success
    consecutiveFailures = 0;
});

worker.on('failed', async (job, err) => {
    console.error(`❌ [Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
    
    // Increment circuit breaker counter
    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES) {
        tripCircuitBreaker();
    }
    
    // If job has exhausted all retries, move to Dead Letter Queue
    if (job.attemptsMade >= (job.opts?.attempts || 1)) {
        console.log(`📮 [Worker] Moving job ${job.id} to Dead Letter Queue`);
        
        try {
            const { Queue } = await import('bullmq');
            const failedQueue = new Queue('nexus-failed-queue', { connection });
            
            await failedQueue.add('dlq_job', {
                originalJob: job.data,
                jobId: job.id,
                error: err.message,
                failedAt: new Date().toISOString(),
                attempts: job.attemptsMade
            });
            
            console.log(`✅ [Worker] Job ${job.id} moved to DLQ`);
        } catch (dlqError) {
            console.error(`❌ [Worker] Failed to move job ${job.id} to DLQ:`, dlqError.message);
        }
    }
});

worker.on('active', (job) => {
    console.log(`⚡ [Worker] Processing job ${job.id}...`);
});

worker.on('stalled', (jobId) => {
    console.warn(`⚠️  [Worker] Job ${jobId} stalled (may be retried)`);
});

worker.on('error', (err) => {
    console.error('💥 [Worker] Worker error:', err);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down worker...`);
    
    try {
        // Close worker (wait for active jobs to complete)
        await worker.close();
        console.log('✅ Worker closed');
        
        // Close Redis connection
        await connection.quit();
        console.log('✅ Redis connection closed');
        
        console.log('👋 Worker shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception in worker:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection in worker:', reason);
    shutdown('UNHANDLED_REJECTION');
});
