const { createClient } = supabase;
// ⚠️ CRITICAL: This MUST match Backend, Mobile, and Frontend!
// Using Mobile/Backend Supabase instance for unified data
const SUPABASE_URL = 'https://zdibotjktsxkrokgipya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkaWJvdGprdHN4a3Jva2dpcHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDAwOTksImV4cCI6MjA3OTExNjA5OX0.dG6WperuZxIyaEmrR9UkCqS-lxruW18u5tuRbgGNRaA';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // --- Get All HTML Elements ---
  const verifyingSection = document.getElementById("verifyingSection");
  const authSection = document.getElementById("authSection");
  const mainSection = document.getElementById("mainSection");
  const authStatus = document.getElementById("authStatus");
  const appStatus = document.getElementById("appStatus");
  const userAvatar = document.getElementById("userAvatar");
  const captureBtn = document.getElementById("captureBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const signInBtn = document.getElementById("signInBtn");
  const signUpBtn = document.getElementById("signUpBtn");

  // --- UI Helper Functions ---
  function showAuth() {
    verifyingSection.style.display = "none";
    authSection.style.display = "flex";
    mainSection.style.display = "none";
    
    // --- This was already correct ---
    chrome.storage.local.remove('supabase_auth_token');
    
    authStatus.textContent = "";
    authStatus.style.color = "#94a3b8";
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
  }

  // --- CHANGED: Made this function async ---
  async function showMain(user) { 
    verifyingSection.style.display = "none";
    authSection.style.display = "none";
    mainSection.style.display = "flex";
    
    // --- ADDED: Save token on login/session load ---
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        chrome.storage.local.set({ 'supabase_auth_token': session.access_token });
        console.log("Auth token saved to storage.");
      }
    } catch (e) {
      console.error("Error saving session token:", e);
    }
    // --- END ADD ---
    
    // Set avatar if available
    if (user.user_metadata && user.user_metadata.avatar_url) {
      userAvatar.src = user.user_metadata.avatar_url;
    }
    // Reset main app status to ready
    setAppStatus("Ready", "#94a3b8");
  }

  function setAuthStatus(msg, isError = false) {
      authStatus.textContent = msg;
      authStatus.style.color = isError ? "#ff6b6b" : "#e4e7eb";
  }

  function setAppStatus(msg, color = "#94a3b8") {
      appStatus.textContent = msg;
      appStatus.style.color = color;
  }

  // --- 1. Initial Session Check (Runs on Popup Open) ---
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showAuth(); // No session -> Show Login screen
    } else {
      // --- CHANGED: Added await ---
      await showMain(user); // Session exists -> Show Main app
    }
  } catch (err) {
    console.error("Error checking initial auth:", err);
    showAuth(); // Fallback to login screen on error
  }

  // --- 2. Event Listeners ---

  // Sign In Button
  signInBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        setAuthStatus("Please enter both email and password.", true);
        return;
    }

    try {
      setAuthStatus("Signing in...");
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      // --- CHANGED: Added await ---
      await showMain(data.user);

    } catch (err) {
      setAuthStatus(err.message, true);
    }
  });

  // Sign Up Button
  signUpBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

     if (!email || !password) {
        setAuthStatus("Please enter an email and password.", true);
        return;
    }

    try {
      setAuthStatus("Creating account...");
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.user && !data.session) {
          setAuthStatus("Account created! Check your email to confirm.", false);
      } else if (data.user && data.session) {
          // --- CHANGED: Added await ---
          await showMain(data.user);
      }

    } catch (err) {
       setAuthStatus(err.message, true);
    }
  });

  // Logout Button
  logoutBtn.addEventListener("click", async () => {
    try {
      await supabaseClient.auth.signOut();
      showAuth(); // This correctly calls the function that removes the token
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });

  // Capture Button
  captureBtn.addEventListener("click", async () => {
    try {
      captureBtn.disabled = true; // Disable to prevent double-clicks
      setAppStatus("Capturing...", "#22d3ee"); // Blue status

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url || !tab.url.startsWith("http")) {
        throw new Error("Cannot capture this type of page.");
      }

      await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            "Readability.js",
            "platformDetector.js",
            "baseExtractor.js",
            "extractors/twitterExtractor.js",
            "extractors/instagramExtractor.js",
            "extractors/youtubeExtractor.js",
            "extractors/tiktokExtractor.js",
            "extractors/linkedinExtractor.js",
            "extractors/facebookExtractor.js",
            "extractors/redditExtractor.js",
            "extractors/articleExtractor.js",
            "content.js"
          ]
      });

      setAppStatus("✅ Capture Sent!", "#4ade80"); // Green status
      
      // Reset after 2 seconds
      setTimeout(() => {
         setAppStatus("Ready", "#94a3b8");
         captureBtn.disabled = false;
      }, 2000);

    } catch (err) {
      console.error(err);
      setAppStatus("❌ Cannot Capture This", "#ff6b6b"); // Red status
      // Reset after 2 seconds
      setTimeout(() => {
        setAppStatus("Ready", "#94a3b8");
        captureBtn.disabled = false;
      }, 2000);
    }
  });

  // Dashboard Button
  dashboardBtn.addEventListener("click", () => {
    // Production frontend URL
    const dashboardUrl = "https://complete-nexus.vercel.app";
    chrome.tabs.create({ url: dashboardUrl });
  });

});