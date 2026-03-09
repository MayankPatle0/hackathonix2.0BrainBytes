
import { BACKEND_API_URL } from './constants';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Polling function to check job status with exponential backoff
const pollForCompletion = async (jobId) => {
  let pollDelay = 1000; // Start at 1 second
  const maxDelay = 5000; // Max 5 seconds
  const maxAttempts = 30; // ~90 seconds timeout
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_API_URL}/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state === 'completed') return data.result;
        if (data.state === 'failed') throw new Error(data.reason || 'Processing failed');
      }
    } catch (e) {
      console.warn('Polling check failed, retrying...', e);
    }
    
    await delay(pollDelay);
    pollDelay = Math.min(pollDelay * 1.5, maxDelay); // Exponential backoff
  }
  throw new Error('Processing timed out. It will appear in your dashboard shortly.');
};

export const saveDataToBackend = async (text, token, metadata = {}) => {
  if (!token) throw new Error("Not logged in");

  try {
    // 1. Send to Backend with Mobile Source Flag
    const response = await fetch(`${BACKEND_API_URL}/receive_data?source=M`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`,
      },
      body: text
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Backend Error: ${response.status} ${err}`);
    }

    const data = await response.json();

    // 2. Handle Async (202 Accepted) vs Sync (200 OK)
    if (response.status === 202) {
      console.log('Job queued:', data.jobId);
      // For mobile UX, we might just return success immediately if we don't need the result instantly,
      // but here we poll to confirm it finishes.
      return await pollForCompletion(data.jobId);
    } else {
      // Sync: Return result directly
      return data;
    }

  } catch (error) {
    console.error("Save Error:", error);
    throw error;
  }
};
