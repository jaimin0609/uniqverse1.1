'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        // Sign out and redirect to home page
        signOut({ callbackUrl: '/' })
            .catch(error => {
                console.error('Logout error:', error);
                // If there's an error, still try to redirect to home
                router.push('/');
            });
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
                <p>You are being redirected...</p>
            </div>
        </div>
    );
}