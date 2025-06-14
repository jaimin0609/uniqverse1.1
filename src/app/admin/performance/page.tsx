"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import PerformanceDashboard from '@/components/admin/PerformanceDashboard';
import { Loader2 } from 'lucide-react';

export default function PerformancePage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!session || session.user.role !== 'ADMIN') {
        redirect('/admin/login');
    }

    return (
        <div className="container mx-auto py-6">
            <PerformanceDashboard />
        </div>
    );
}
