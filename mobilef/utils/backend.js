// mobilef/utils/backend.js
import { BACKEND_API_URL } from './constants';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

const headers = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// Enhanced fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Retry logic for failed requests
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Only retry on server errors (5xx) or network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      lastError = new Error(`Server error: ${response.status}`);
      
      // Exponential backoff: 1s, 2s, 4s
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (auth, validation, etc.)
      if (error.message?.includes('401') || error.message?.includes('400')) {
        throw error;
      }
      
      // Retry on network errors or timeouts
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
};

export const getMemories = (token) =>
  fetchWithRetry(`${BACKEND_API_URL}/memories`, { 
    headers: headers(token) 
  })
    .then((r) => {
      if (r.ok) return r.json();
      if (r.status === 401) throw new Error('Unauthorized');
      throw new Error(`Failed to fetch memories: ${r.status}`);
    });

export const searchMemories = (token, q) =>
  fetchWithRetry(`${BACKEND_API_URL}/search?q=${encodeURIComponent(q)}`, { 
    headers: headers(token) 
  })
    .then((r) => {
      if (r.ok) return r.json();
      if (r.status === 401) throw new Error('Unauthorized');
      throw new Error(`Search failed: ${r.status}`);
    });