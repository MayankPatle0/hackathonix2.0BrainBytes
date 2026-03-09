// mobilef/utils/constants.js
import Constants from 'expo-constants';

// Get configuration with fallback values for release builds
// In release builds, expoConfig may not be available, so we use manifest as fallback
const getExtra = () => {
  try {
    return Constants.expoConfig?.extra || Constants.manifest?.extra || {};
  } catch (error) {
    console.warn('Could not access Constants:', error.message);
    return {};
  }
};

const extra = getExtra();

// Hardcoded fallbacks ensure app works even if config is missing
export const SUPABASE_URL = extra.SUPABASE_URL || 'https://zdibotjktsxkrokgipya.supabase.co';
export const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkaWJvdGprdHN4a3Jva2dpcHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDAwOTksImV4cCI6MjA3OTExNjA5OX0.dG6WperuZxIyaEmrR9UkCqS-lxruW18u5tuRbgGNRaA';
export const BACKEND_API_URL = extra.BACKEND_API_URL || 'https://complete-nexus.onrender.com';
export const REDIRECT_URL = extra.REDIRECT_URL || 'nexus://';
export const FRONTEND_URL = extra.FRONTEND_URL || 'https://complete-nexus.vercel.app';
