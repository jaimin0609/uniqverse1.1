"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { handleLogout } from '@/utils/logout-utils';

export default function DirectAdminAccess() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        // Capture detailed session debugging information
        const userRole = session?.user?.role;
        const isAdmin =
            userRole === 'ADMIN' ||
            (typeof userRole === 'object' && String(userRole) === 'ADMIN');

        try {
            const info = {
                status,
                isAdmin,
                userRole,
                userRoleType: typeof userRole,
                userRoleStringified: JSON.stringify(userRole),
                sessionExists: !!session,
                userExists: !!session?.user,
                hasRoleProp: 'role' in (session?.user || {}),
                rawSession: session ? JSON.stringify({
                    ...session,
                    user: session.user ? {
                        ...session.user,
                        role: String(session.user.role)
                    } : null
                }) : 'No session'
            };

            console.log('Direct Admin Access DEBUG:', info);
            setDebugInfo(info);
        } catch (e) {
            console.error('Error in direct admin:', e);
            setDebugInfo({ error: String(e) });
        }
    }, [session, status]);

    if (status === "loading") {
        return <div className="p-8">Loading session information...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Admin Session Diagnostic</h1>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">Session Status</h2>
                <p><strong>Authentication Status:</strong> {status}</p>
                <p><strong>User:</strong> {session?.user?.name || 'Not signed in'}</p>
                <p><strong>Email:</strong> {session?.user?.email || 'N/A'}</p>
                <p><strong>Role:</strong> {String(session?.user?.role || 'None')}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
                <pre className="whitespace-pre-wrap bg-gray-800 text-white p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>

            <div className="flex flex-col gap-4 mt-8">                <Link href="/admin" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Try Regular Admin Dashboard
            </Link>
                <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Return to Homepage
                </Link>                <button
                    onClick={() => handleLogout()}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}