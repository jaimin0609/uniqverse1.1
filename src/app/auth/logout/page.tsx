'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function LogoutPage() {
    const { data: session } = useSession();
    const [logoutStatus, setLogoutStatus] = useState('logging_out');

    useEffect(() => {
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
            }

            try {
                console.log('Starting logout process');

                // Use NextAuth signOut with immediate redirect
                await signOut({
                    redirect: false,
                    callbackUrl: '/'
                });

                console.log('SignOut completed, redirecting to home...');
                setLogoutStatus('success');

                // Immediate redirect - no delay
                window.location.href = '/';

            } catch (error) {
                console.error('SignOut error:', error);
                // Fallback to direct redirect
                setLogoutStatus('success');
                window.location.href = '/';
            }
        };

        // Start logout immediately
        performLogout();
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                    {logoutStatus === 'logging_out' && 'Logging out...'}
                    {logoutStatus === 'success' && 'Logged out successfully!'}
                </h1>
                <p>
                    {logoutStatus === 'logging_out' && 'Please wait while we log you out...'}
                    {logoutStatus === 'success' && 'Redirecting to homepage...'}
                </p>
                <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
                {/* Emergency fallback button - should rarely be needed */}
                <div className="mt-6">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Click here if not redirected automatically
                    </button>
                </div>
            </div>
        </div>
    );
}