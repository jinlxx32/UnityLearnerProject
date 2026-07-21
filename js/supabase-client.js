/*
 * ==============================================================================
 * LOGIC OUTLINE & ARCHITECTURE:
 * 1. Supabase Client Module:
 *    - Loads and initializes the Supabase client using window.supabase.
 *    - Provides configurable placeholders for SUPABASE_URL and SUPABASE_ANON_KEY.
 * 2. Helper Functions (wrapped in try-catch blocks):
 *    - getSession(): Returns active session or null.
 *    - requireAuth(): Auth guard that checks session and redirects unauthenticated users to /auth/.
 *    - requireGuest(): Guest guard that redirects already logged-in users away from /auth/ to /dashboard/.
 *    - signUp(email, password, fullName): Handles sign up, metadata storage, and instant session creation.
 *    - signIn(email, password): Authenticates user credentials.
 *    - signOut(): Logs user out and redirects to /auth/.
 *    - updateUserProfile(data): Updates user metadata (e.g. full_name).
 *    - updateUserPassword(newPassword): Updates user account password.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// SUPABASE CONFIGURATION - Replace these values with your Supabase Project settings
// (Found in Supabase Dashboard -> Project Settings -> API)
// ------------------------------------------------------------------------------
const SUPABASE_URL = "https://dbhgrpewqbahyyaixroz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaGdycGV3cWJhaHl5YWl4cm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTg4MDYsImV4cCI6MjEwMDE3NDgwNn0.W3rTbeRXH-drDwF_tYDDwx-hruTdn0SV9Exzjcbe1FY";

// Global Supabase client instance
let supabaseClient = null;

/**
 * Initializes and returns the Supabase client.
 */
function getSupabase() {
    if (!supabaseClient) {
        if (typeof window.supabase === 'undefined') {
            console.error("Supabase JS SDK not loaded. Please include the Supabase CDN script tag.");
            return null;
        }

        if (SUPABASE_URL === "YOUR_SUPABASE_PROJECT_URL" || SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY") {
            console.warn("Supabase credentials are using placeholder values. Please update SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-client.js");
        }

        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (error) {
            console.error("Failed to initialize Supabase client:", error);
            return null;
        }
    }
    return supabaseClient;
}

/**
 * Retrieves the current session asynchronously.
 */
async function getSession() {
    try {
        const client = getSupabase();
        if (!client) return null;
        const { data, error } = await client.auth.getSession();
        if (error) {
            console.error("Error getting session:", error.message);
            return null;
        }
        return data.session;
    } catch (err) {
        console.error("Unexpected error fetching session:", err);
        return null;
    }
}

/**
 * Retrieves the current user asynchronously.
 */
async function getCurrentUser() {
    try {
        const session = await getSession();
        return session ? session.user : null;
    } catch (err) {
        console.error("Error getting current user:", err);
        return null;
    }
}

/**
 * Auth Guard: Ensures user is authenticated. Redirects to /auth/ if unauthenticated.
 */
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        window.location.href = '/auth/';
        return null;
    }
    return session;
}

/**
 * Guest Guard: Ensures user is NOT authenticated. Redirects to /dashboard/ if authenticated.
 */
async function requireGuest() {
    const session = await getSession();
    if (session) {
        window.location.href = '/dashboard/';
        return null;
    }
    return true;
}

/**
 * Signs up a new user with email, password, and optional full name metadata.
 */
async function signUp(email, password, fullName = '') {
    try {
        const client = getSupabase();
        if (!client) throw new Error("Supabase client not initialized.");

        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    full_name: fullName.trim()
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (err) {
        console.error("SignUp error:", err);
        return { success: false, error: err.message || "An unexpected error occurred during Sign Up." };
    }
}

/**
 * Signs in an existing user with email and password.
 */
async function signIn(email, password) {
    try {
        const client = getSupabase();
        if (!client) throw new Error("Supabase client not initialized.");

        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (err) {
        console.error("SignIn error:", err);
        return { success: false, error: err.message || "An unexpected error occurred during Log In." };
    }
}

/**
 * Signs out the current user and redirects to /auth/.
 */
async function signOut() {
    try {
        const client = getSupabase();
        if (client) {
            await client.auth.signOut();
        }
    } catch (err) {
        console.error("SignOut error:", err);
    } finally {
        window.location.href = '/auth/';
    }
}

/**
 * Updates current user metadata (e.g., full_name).
 */
async function updateUserProfile(data) {
    try {
        const client = getSupabase();
        if (!client) throw new Error("Supabase client not initialized.");

        const { data: userData, error } = await client.auth.updateUser({
            data: data
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, user: userData.user };
    } catch (err) {
        console.error("Profile update error:", err);
        return { success: false, error: err.message || "Failed to update profile." };
    }
}

/**
 * Updates current user password.
 */
async function updateUserPassword(newPassword) {
    try {
        const client = getSupabase();
        if (!client) throw new Error("Supabase client not initialized.");

        const { data, error } = await client.auth.updateUser({
            password: newPassword
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, user: data.user };
    } catch (err) {
        console.error("Password update error:", err);
        return { success: false, error: err.message || "Failed to update password." };
    }
}

// Make functions globally accessible for browser scripts
window.AuthService = {
    getSupabase,
    getSession,
    getCurrentUser,
    requireAuth,
    requireGuest,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    updateUserPassword,
    CONFIG: {
        URL: SUPABASE_URL,
        KEY: SUPABASE_ANON_KEY
    }
};
