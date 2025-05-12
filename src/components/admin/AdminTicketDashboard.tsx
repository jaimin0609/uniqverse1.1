"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { formatDate } from '@/utils/format';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    MessageSquare,
    ArrowDownUp,
    XCircle,
    ArrowUpCircle,
    AlertTriangle,
    FilterX,
} from 'lucide-react';

// Status badge color mapping
const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    AWAITING_CUSTOMER: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    RESOLVED: 'bg-green-100 text-green-800 hover:bg-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
};

// Priority badge color mapping
const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
};

// Status display names
const statusNames: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    AWAITING_CUSTOMER: 'Awaiting Customer',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

export function AdminTicketDashboard() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState<any>({});
    const [pagination, setPagination] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get current filter values from URL
    const currentStatus = searchParams.get('status') || '';
    const currentPriority = searchParams.get('priority') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');

    // Status icon component
    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'OPEN':
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case 'IN_PROGRESS':
                return <RefreshCw className="h-4 w-4 text-amber-500" />;
            case 'AWAITING_CUSTOMER':
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            case 'RESOLVED':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'CLOSED':
                return <Clock className="h-4 w-4 text-gray-500" />;
            default:
                return null;
        }
    };

    // Priority icon component
    const PriorityIcon = ({ priority }: { priority: string }) => {
        switch (priority) {
            case 'LOW':
                return <ArrowDownUp className="h-4 w-4 text-gray-500" />;
            case 'MEDIUM':
                return <ArrowUpCircle className="h-4 w-4 text-blue-500" />;
            case 'HIGH':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'URGENT':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    // Update URL with filters
    const updateFilters = (
        status: string | null = null,
        priority: string | null = null,
        page: number | null = null
    ) => {
        const params = new URLSearchParams(searchParams.toString());

        if (status !== null) {
            if (status) {
                params.set('status', status);
            } else {
                params.delete('status');
            }
        }

        if (priority !== null) {
            if (priority) {
                params.set('priority', priority);
            } else {
                params.delete('priority');
            }
        }

        if (page !== null) {
            if (page > 1) {
                params.set('page', page.toString());
            } else {
                params.delete('page');
            }
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    // Fetch tickets with current filters
    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                let url = '/api/admin/tickets?';
                const params = new URLSearchParams();

                if (currentStatus) params.append('status', currentStatus);
                if (currentPriority) params.append('priority', currentPriority);
                params.append('page', currentPage.toString());

                const response = await fetch(`${url}${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch tickets');
                }

                const data = await response.json();
                setTickets(data.tickets);
                setPagination(data.pagination);
                setStats(data.stats);
            } catch (error) {
                console.error('Error fetching tickets:', error);
                setError('Failed to load tickets. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickets();
    }, [currentStatus, currentPriority, currentPage]);

    // Clear all filters
    const clearFilters = () => {
        router.push(pathname);
    };

    // Render loading state
    if (isLoading && !tickets.length) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-16" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>

                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <Skeleton className="h-5 w-64 mb-2" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center mt-6">
                    <Skeleton className="h-10 w-64" />
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Open Tickets</CardDescription>
                        <CardTitle>{stats.open || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-blue-500 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Require attention
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>In Progress</CardDescription>
                        <CardTitle>{stats.inProgress || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-amber-500 flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Currently being worked on
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Awaiting Customer</CardDescription>
                        <CardTitle>{stats.awaitingCustomer || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-purple-500 flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Waiting for customer response
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>High Priority</CardDescription>
                        <CardTitle>{(stats.highPriority || 0) + (stats.urgent || 0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-red-500 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Require immediate attention
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={currentStatus}
                        onValueChange={(value) => updateFilters(value === "ALL" ? "" : value, null, 1)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="AWAITING_CUSTOMER">Awaiting Customer</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={currentPriority}
                        onValueChange={(value) => updateFilters(null, value === "ALL" ? "" : value, 1)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Priorities</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                    </Select>

                    {(currentStatus || currentPriority) && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={clearFilters}
                            title="Clear all filters"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="text-sm text-gray-500">
                    {pagination.total ? (
                        <span>
                            Showing {((currentPage - 1) * pagination.limit) + 1}-
                            {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} tickets
                        </span>
                    ) : (
                        <span>No tickets found</span>
                    )}
                </div>
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-lg border">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets found</h3>
                    <p className="text-sm text-gray-500">
                        {currentStatus || currentPriority ?
                            'Try changing your filters to see more results.' :
                            'There are no support tickets in the system yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket: any) => (
                        <div
                            key={ticket.id}
                            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                            onClick={() => router.push(`/admin/support-management/tickets/${ticket.id}`)}
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <h3 className="font-medium text-lg flex items-center gap-2 mb-1">
                                        <StatusIcon status={ticket.status} />
                                        {ticket.subject}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span>#{ticket.id.substring(0, 8)}</span>
                                        <span>
                                            {ticket.user?.name}
                                            <span className="text-gray-400 ml-1">({ticket.user?.email})</span>
                                        </span>
                                        <span>
                                            Created {formatDate(new Date(ticket.createdAt), {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        {ticket.replies.length > 0 && (
                                            <span className="flex items-center">
                                                <MessageSquare className="h-3 w-3 mr-1" />
                                                {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge className={statusColors[ticket.status]}>
                                        {statusNames[ticket.status]}
                                    </Badge>
                                    <Badge className={priorityColors[ticket.priority]}>
                                        <PriorityIcon priority={ticket.priority} />
                                        <span className="ml-1">{ticket.priority}</span>
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Pagination className="mt-8">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) {
                                        updateFilters(null, null, currentPage - 1);
                                    }
                                }}
                                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>

                        {Array.from({ length: pagination.pages }).map((_, i) => {
                            const page = i + 1;

                            // Show first, last, current, and pages around current
                            if (
                                page === 1 ||
                                page === pagination.pages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilters(null, null, page);
                                            }}
                                            isActive={page === currentPage}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }

                            // Show ellipsis for skipped pages
                            if (
                                page === 2 ||
                                page === pagination.pages - 1
                            ) {
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }

                            return null;
                        })}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < pagination.pages) {
                                        updateFilters(null, null, currentPage + 1);
                                    }
                                }}
                                className={currentPage >= pagination.pages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}