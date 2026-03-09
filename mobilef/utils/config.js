// mobilef/utils/config.js
import Constants from 'expo-constants';

// Get backend URL from app.json configuration
const config = {
    BACKEND_URL: Constants.expoConfig?.extra?.BACKEND_API_URL || 'https://complete-nexus.onrender.com',
    SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL,
    SUPABASE_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY,
};

export default config;
