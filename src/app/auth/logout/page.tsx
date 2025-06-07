'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [logoutStatus, setLogoutStatus] = useState('logging_out');

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const performLogout = async () => {
            console.log('Logout page: starting logout process');
            setLogoutStatus('logging_out');

            // Clear storage first
            try {
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                }
            } catch (e) {
                console.warn('Storage clear error:', e);
            } try {
                // Use consistent logout approach for all devices
                if (typeof window !== 'undefined') {
                    console.log('Starting logout process for all devices');

                    try {
                        // Use NextAuth signOut but handle redirect manually for all devices
                        await signOut({
                            redirect: false, // Don't auto-redirect
                            callbackUrl: '/'
                        });

                        console.log('SignOut completed, redirecting to home...');
                        setLogoutStatus('success');

                        // Force navigation to home page after a brief delay
                        setTimeout(() => {
                            window.location.replace('/');
                        }, 1000);

                    } catch (error) {
                        console.error('SignOut error:', error);
                        // Fallback to direct redirect
                        setLogoutStatus('success');
                        window.location.replace('/');
                    }
                }
            } catch (error) {
                console.error('Logout error:', error);
                setLogoutStatus('error');

                // Fallback: direct redirect after short delay
                timeoutId = setTimeout(() => {
                    window.location.replace('/');
                }, 2000);
            }
        };

        // Add a small delay to prevent immediate execution
        timeoutId = setTimeout(performLogout, 500);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [router]);

    // Fallback redirect if logout takes too long
    useEffect(() => {
        const fallbackTimeout = setTimeout(() => {
            if (logoutStatus === 'logging_out') {
                console.log('Logout taking too long, forcing redirect');
                window.location.replace('/');
            }
        }, 8000); // 8 second fallback

        return () => clearTimeout(fallbackTimeout);
    }, [logoutStatus]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                    {logoutStatus === 'logging_out' && 'Logging out...'}
                    {logoutStatus === 'success' && 'Logged out successfully!'}
                    {logoutStatus === 'error' && 'Logout error - redirecting...'}
                </h1>
                <p>
                    {logoutStatus === 'logging_out' && 'Please wait while we log you out...'}
                    {logoutStatus === 'success' && 'You are being redirected to the homepage...'}
                    {logoutStatus === 'error' && 'There was an issue, but you will be redirected anyway...'}
                </p>
                <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
                {/* Fallback button for if redirect fails */}
                <div className="mt-6">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-primary hover:text-primary/80 text-sm underline"
                    >
                        Click here if not redirected automatically
                    </button>
                </div>
            </div>
        </div>
    );
}