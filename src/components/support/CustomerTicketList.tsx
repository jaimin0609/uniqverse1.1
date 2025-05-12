"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    File,
    Loader2,
    MessageSquare,
    PlusCircle,
    RefreshCw,
    User
} from 'lucide-react';

// Status badge color mapping
const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    AWAITING_CUSTOMER: 'bg-purple-100 text-purple-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
};

// Status display names
const statusNames: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    AWAITING_CUSTOMER: 'Awaiting Your Reply',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

// Status icons
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

export function CustomerTicketList() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch tickets on component mount
    useEffect(() => {
        fetchTickets();
    }, []);

    // Function to fetch tickets
    const fetchTickets = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/support/tickets');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch tickets');
            }

            const data = await response.json();
            setTickets(data.tickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setError(error instanceof Error ? error.message : 'Failed to load tickets');
            toast.error('Failed to load tickets. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle refresh button click
    const handleRefresh = () => {
        fetchTickets();
        toast.success('Refreshed ticket list');
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">My Support Tickets</h1>
                    <div className="skeleton w-24 h-9"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="h-6 w-48 bg-gray-200 rounded-md mb-2"></div>
                                <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-12 w-full bg-gray-100 rounded-md"></div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
                                <div className="h-9 w-20 bg-gray-200 rounded-md"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-lg mx-auto">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Unable to load tickets</h2>
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                    onClick={fetchTickets}
                    variant="outline"
                    className="mx-auto"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    // Render empty state
    if (tickets.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">My Support Tickets</h1>
                    <Button
                        onClick={() => router.push('/support')}
                        variant="outline"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Ticket
                    </Button>
                </div>

                <Card className="text-center py-8 px-4">
                    <CardContent>
                        <File className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-medium mb-2">No Support Tickets</h2>
                        <p className="text-gray-600 mb-6">
                            You haven't created any support tickets yet. Need help with something?
                        </p>
                        <Button
                            onClick={() => router.push('/support')}
                            className="mx-auto"
                        >
                            Create Your First Ticket
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render ticket list
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Support Tickets</h1>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => router.push('/support')}
                        size="sm"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Ticket
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} className="shadow-sm relative overflow-hidden">
                        {ticket.status === 'AWAITING_CUSTOMER' && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-transparent border-r-purple-500 shadow-md"></div>
                        )}

                        <CardHeader className="pb-2">
                            <CardTitle className="font-medium text-lg">
                                <Link
                                    href={`/account/support/tickets/${ticket.id}`}
                                    className="hover:text-blue-600 hover:underline flex items-center gap-2"
                                >
                                    <StatusIcon status={ticket.status} />
                                    {ticket.subject}
                                </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Badge className={statusColors[ticket.status]}>
                                    {statusNames[ticket.status]}
                                </Badge>
                                <span className="text-gray-500 text-xs">
                                    Ticket #{ticket.id.substring(0, 8)}
                                </span>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-4">
                            <p className="text-gray-700 line-clamp-2">
                                {ticket.description}
                            </p>

                            {ticket.replies && ticket.replies.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm flex items-start gap-2">
                                        <span className="mt-0.5">
                                            {ticket.replies[0].isAdminReply ? (
                                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <User className="h-4 w-4 text-gray-500" />
                                            )}
                                        </span>
                                        <span className="font-medium">
                                            {ticket.replies[0].isAdminReply ? 'Support Team' : 'You'}:
                                        </span>
                                        <span className="text-gray-600 line-clamp-1">
                                            {ticket.replies[0].content}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between pt-1">
                            <div className="text-xs text-gray-500">
                                {ticket.updatedAt !== ticket.createdAt ? (
                                    <span>
                                        Updated {formatDate(new Date(ticket.updatedAt), {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                ) : (
                                    <span>
                                        Created {formatDate(new Date(ticket.createdAt), {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                )}
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => router.push(`/account/support/tickets/${ticket.id}`)}
                            >
                                View Ticket
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}