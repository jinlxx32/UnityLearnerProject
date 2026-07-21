/*
 * ==============================================================================
 * LOGIC OUTLINE & ARCHITECTURE:
 * Visitor Analytics Module (js/analytics.js):
 * 1. Asynchronously fetches visitor's public IP using lightweight ipify API.
 * 2. Collects browser info (navigator.userAgent), current page path (window.location.pathname),
 *    and referrer URL (document.referrer).
 * 3. Inserts a new row into the Supabase `page_views` table using window.AuthService or window.supabase.
 * 4. Wrapped in try-catch to ensure failure in IP fetch or logging never impacts page loading.
 * ==============================================================================
 */

async function logPageView() {
    try {
        // Wait for Supabase client
        const client = window.AuthService ? window.AuthService.getSupabase() : null;
        if (!client) {
            console.warn("Analytics: Supabase client not ready.");
            return;
        }

        // 1. Asynchronously fetch public IP address with timeout
        let visitorIp = 'Unknown';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s max

            const ipResponse = await fetch('https://api.ipify.org?format=json', { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                visitorIp = ipData.ip || 'Unknown';
            }
        } catch (ipErr) {
            console.warn("Analytics: IP fetch skipped/blocked or timed out.");
        }

        // 2. Insert visit record into Supabase `page_views` table
        const visitData = {
            page_path: window.location.pathname || '/',
            user_agent: navigator.userAgent || 'Unknown',
            ip_address: visitorIp,
            referrer: document.referrer || 'Direct'
        };

        const { error } = await client.from('page_views').insert([visitData]);

        if (error) {
            console.warn("Analytics insertion note:", error.message);
        } else {
            console.log("Analytics: Page view logged successfully.");
        }

    } catch (err) {
        console.error("Analytics error:", err);
    }
}

// Automatically trigger visitor tracking on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure non-blocking page render
    setTimeout(logPageView, 300);
});
