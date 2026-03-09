// Backend/Server/monitoring.js
/**
 * Admin Monitoring Dashboard
 * Provides real-time stats for queue health and system status
 */

import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null
});

const analysisQueue = new Queue('nexus-ai-queue', { connection });
const failedQueue = new Queue('nexus-failed-queue', { connection });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Queue statistics
app.get('/admin/stats', async (req, res) => {
  try {
    const [
      waiting,
      active,
      completed,
      failed,
      dlqCount,
      repeatableCount
    ] = await Promise.all([
      analysisQueue.getWaitingCount(),
      analysisQueue.getActiveCount(),
      analysisQueue.getCompletedCount(),
      analysisQueue.getFailedCount(),
      failedQueue.count(),
      analysisQueue.getRepeatableCount()
    ]);

    // Get worker metrics
    const workers = await analysisQueue.getWorkers();

    res.json({
      status: 'ok',
      queue: {
        waiting,
        active,
        completed,
        failed,
        deadLetterQueue: dlqCount,
        repeatable: repeatableCount
      },
      workers: {
        count: workers.length,
        active: workers.filter(w => w.isRunning()).length
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get recent failed jobs
app.get('/admin/failed-jobs', async (req, res) => {
  try {
    const jobs = await analysisQueue.getFailed(0, 10);
    
    const jobDetails = jobs.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    }));

    res.json({
      count: jobs.length,
      jobs: jobDetails
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get queue metrics over time
app.get('/admin/metrics', async (req, res) => {
  try {
    const completedJobs = await analysisQueue.getCompleted(0, 100);
    
    // Calculate average processing time
    const processingTimes = completedJobs
      .filter(j => j.finishedOn && j.processedOn)
      .map(j => j.finishedOn - j.processedOn);
    
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    res.json({
      averageProcessingTime: Math.round(avgProcessingTime),
      recentCompletedCount: completedJobs.length,
      successRate: completedJobs.length / (completedJobs.length + await analysisQueue.getFailedCount()) * 100
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ⭐ NEW: Groq API Key Health Dashboard
app.get('/admin/groq-health', async (req, res) => {
  try {
    // This endpoint will be dynamically populated by the worker
    // For now, return placeholder indicating it requires worker integration
    res.json({
      message: "Health metrics available after worker starts",
      note: "The worker exposes groqManager.getHealthMetrics() which can be accessed via shared module or IPC"
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

const PORT = process.env.MONITORING_PORT || 3002;

app.listen(PORT, () => {
  console.log(`📊 Monitoring Dashboard running on port ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/health`);
  console.log(`   Stats:       http://localhost:${PORT}/admin/stats`);
  console.log(`   Groq Health: http://localhost:${PORT}/admin/groq-health`);
});

export default app;
