// supabaseClient.js
// import { createClient } from "./lib/supabase.js";

const SUPABASE_URL = "https://zdibotjktsxkrokgipya.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkaWJvdGprdHN4a3Jva2dpcHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDAwOTksImV4cCI6MjA3OTExNjA5OX0.dG6WperuZxIyaEmrR9UkCqS-lxruW18u5tuRbgGNRaA";


export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
