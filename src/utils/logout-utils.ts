// Utility functions for handling logout across different devices and browsers
export const handleLogout = () => {
    try {
        // Clear all local storage and session storage
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
    } catch (e) {
        console.warn('Storage clear error:', e);
    }

    // Use our custom logout page for all devices to ensure consistent behavior
    // This bypasses NextAuth's confirmation page entirely
    window.location.href = '/auth/logout';
};

// Alternative: Force the logout page for all devices (more consistent)
export const handleLogoutConsistent = () => {
    try {
        // Clear all local storage and session storage
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
    } catch (e) {
        console.warn('Storage clear error:', e);
    }

    // Always use the logout page for consistent behavior
    window.location.href = '/auth/logout';
};

// Mobile-specific logout handler with better compatibility
export const handleMobileLogout = () => {
    try {
        // Clear all local storage and session storage
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
    } catch (e) {
        console.warn('Storage clear error:', e);
    }

    // For mobile browsers, use a simple form submission approach
    if (typeof window !== 'undefined') {
        // Create a hidden form to submit to the logout endpoint
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = '/api/auth/signout';

        // Add callbackUrl as a hidden input
        const callbackInput = document.createElement('input');
        callbackInput.type = 'hidden';
        callbackInput.name = 'callbackUrl';
        callbackInput.value = '/';
        form.appendChild(callbackInput);

        // Add form to body and submit
        document.body.appendChild(form);
        form.submit();
    }
};
