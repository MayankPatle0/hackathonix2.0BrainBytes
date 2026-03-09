// API Configuration
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://complete-nexus.onrender.com';

/**
 * Polls the backend job status endpoint until completion or failure.
 * Uses exponential backoff to reduce server load.
 */
export async function pollJob(jobId: string, onProgress?: (status: string) => void): Promise<any> {
    let delay = 500; // Start at 500ms
    const maxDelay = 5000; // Max 5 seconds
    const maxAttempts = 30; // ~60 seconds total

    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`);
            if (!res.ok) throw new Error("Failed to check job status");
            
            const data = await res.json();
            
            if (data.state === 'completed') {
                return data.result;
            } else if (data.state === 'failed') {
                throw new Error(data.reason || 'Job failed processing');
            }
            
            if (onProgress) onProgress(data.state || 'processing');
            
            // Wait before next poll with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, maxDelay); // Increase delay gradually
        } catch (e) {
            console.error("Polling error", e);
            throw e; 
        }
    }
    throw new Error("Job polling timed out. The server might be busy.");
}

/**
 * Sends content to the backend for AI analysis.
 */
export async function addMemoryWithQueue(text: string, token: string | null, onStatusUpdate?: (status: string) => void) {
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${BACKEND_URL}/receive_data`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${token}`
        },
        body: text
    });

    if (response.status === 202) {
        // Queued - start polling
        const { jobId } = await response.json();
        if (onStatusUpdate) onStatusUpdate('queued');
        return await pollJob(jobId, onStatusUpdate);
    } else {
        const errData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Server Error: ${errData.error || response.status}`);
    }
}
