'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

interface NewsletterSubscription {
    id: string;
    email: string;
    status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';
    subscribedAt: string;
    unsubscribedAt: string | null;
    source: string | null;
}

export default function NewsletterManagementPage() {
    const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        unsubscribed: 0,
        bounced: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED'>('ALL');

    useEffect(() => {
        fetchSubscriptions();
    }, [currentPage, filter]);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...(filter !== 'ALL' && { status: filter }),
            });

            const response = await fetch(`/api/admin/newsletter?${params}`);
            const data = await response.json();

            if (response.ok) {
                setSubscriptions(data.subscriptions);
                setStats(data.stats);
                setTotalPages(data.totalPages);
            } else {
                console.error('Failed to fetch subscriptions:', data.error);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportSubscribers = async () => {
        try {
            const response = await fetch('/api/admin/newsletter/export');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            ACTIVE: 'bg-green-100 text-green-800',
            UNSUBSCRIBED: 'bg-gray-100 text-gray-800',
            BOUNCED: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6">      <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Newsletter Management</h1>
                <p className="text-gray-600 mt-1">Manage newsletter subscribers and subscriptions</p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={exportSubscribers}>
                    Export Subscribers
                </Button>
                <Link href="/admin/newsletter/send-campaign">
                    <Button>Send Campaign</Button>
                </Link>
            </div>
        </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Total Subscribers</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Active</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Unsubscribed</h3>
                    <p className="text-2xl font-bold text-gray-600">{stats.unsubscribed}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Bounced</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.bounced}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="flex gap-2">
                    {['ALL', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED'].map((status) => (
                        <Button
                            key={status}
                            variant={filter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                setFilter(status as typeof filter);
                                setCurrentPage(1);
                            }}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscribed</TableHead>
                            <TableHead>Unsubscribed</TableHead>
                            <TableHead>Source</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Loading subscriptions...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : subscriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No subscriptions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions.map((subscription) => (
                                <TableRow key={subscription.id}>
                                    <TableCell className="font-medium">{subscription.email}</TableCell>
                                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                                    <TableCell>{formatDate(subscription.subscribedAt)}</TableCell>
                                    <TableCell>
                                        {subscription.unsubscribedAt ? formatDate(subscription.unsubscribedAt) : '-'}
                                    </TableCell>
                                    <TableCell>{subscription.source || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
