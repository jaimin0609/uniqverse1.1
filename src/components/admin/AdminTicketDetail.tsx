"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Clock,
    RefreshCw,
    Send,
    MessageSquare,
    User,
    XCircle,
    MailCheck,
} from 'lucide-react';

// Ticket status badge color mapping
const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    AWAITING_CUSTOMER: 'bg-purple-100 text-purple-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
};

// Ticket priority badge color mapping
const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
};

// Ticket status display names
const statusNames: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    AWAITING_CUSTOMER: 'Awaiting Customer',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

interface AdminTicketDetailProps {
    ticketId: string;
}

export function AdminTicketDetail({ ticketId }: AdminTicketDetailProps) {
    const [ticket, setTicket] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [priorityLoading, setPriorityLoading] = useState(false);
    const router = useRouter();

    // Fetch ticket details
    useEffect(() => {
        const fetchTicket = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/support/tickets/${ticketId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch ticket');
                }
                const data = await response.json();
                setTicket(data.ticket);
                setSelectedStatus(data.ticket.status);
                setSelectedPriority(data.ticket.priority);
            } catch (error) {
                console.error('Error fetching ticket:', error);
                setError(error instanceof Error ? error.message : 'Failed to load ticket');
            } finally {
                setIsLoading(false);
            }
        };

        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    // Handle reply submission
    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: reply,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit reply');
            }

            const data = await response.json();

            // Update the ticket with the new reply and use the status returned from the API
            setTicket(prevTicket => ({
                ...prevTicket,
                replies: [...prevTicket.replies, data.reply],
                status: data.ticketStatus // Use the status returned from the API
            }));

            setSelectedStatus(data.ticketStatus); // Update the selected status dropdown
            setReply('');
            toast.success('Reply submitted successfully');
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle status change
    const handleStatusChange = async (value: string) => {
        if (value === selectedStatus) return;

        setSelectedStatus(value);
        setStatusLoading(true);

        try {
            const response = await fetch(`/api/support/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            toast.success(`Ticket status updated to ${statusNames[value]}`);

            // Update local ticket state
            setTicket(prevTicket => ({
                ...prevTicket,
                status: value
            }));
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
            // Revert to previous value on error
            setSelectedStatus(ticket?.status);
        } finally {
            setStatusLoading(false);
        }
    };

    // Handle priority change
    const handlePriorityChange = async (value: string) => {
        if (value === selectedPriority) return;

        setSelectedPriority(value);
        setPriorityLoading(true);

        try {
            const response = await fetch(`/api/support/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priority: value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update priority');
            }

            toast.success(`Ticket priority updated to ${value}`);

            // Update local ticket state
            setTicket(prevTicket => ({
                ...prevTicket,
                priority: value
            }));
        } catch (error) {
            console.error('Error updating priority:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update priority');
            // Revert to previous value on error
            setSelectedPriority(ticket?.priority);
        } finally {
            setPriorityLoading(false);
        }
    };

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

    // Canned response templates
    const cannedResponses = [
        {
            label: 'Greeting',
            text: `Hello ${ticket?.user?.name || 'there'},\n\nThank you for contacting Uniqverse Support. I'd be happy to help you with your inquiry.\n\n`
        },
        {
            label: 'Request More Info',
            text: 'To better assist you with this issue, could you please provide more details about:\n\n1. What specific steps you took\n2. Any error messages you received\n3. When this issue started occurring\n\nWith this additional information, we will be able to provide more accurate assistance.'
        },
        {
            label: 'Issue Resolved',
            text: 'I\'m pleased to inform you that we\'ve resolved the issue you reported. Here\'s a summary of what was done:\n\n[DETAIL THE SOLUTION HERE]\n\nPlease try again and let us know if you encounter any further issues.'
        },
        {
            label: 'Closing',
            text: 'Is there anything else you need help with? If not, we\'ll close this ticket in 48 hours, but feel free to reach out again if you have any further questions.\n\nBest regards,\nThe Uniqverse Support Team'
        }
    ];

    // Render loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="sm" className="mr-2">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <Skeleton className="h-6 w-64" />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between mb-6">
                        <Skeleton className="h-8 w-72" />
                        <div className="flex space-x-2">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                    </div>

                    <Skeleton className="h-20 w-full mb-8" />

                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-40 mb-2" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{error}</p>
                <div className="mt-4 space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/admin/support-management/tickets')}
                    >
                        Back to Tickets
                    </Button>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-amber-700">Ticket not found or access denied.</p>
                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => router.push('/admin/support-management/tickets')}
                >
                    Back to Tickets
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="mr-4"
                    onClick={() => router.push('/admin/support-management/tickets')}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to tickets
                </Button>
                <h1 className="text-xl font-bold flex-1">Ticket #{ticketId.substring(0, 8)}</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <StatusIcon status={ticket.status} />
                            {ticket.subject}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Created {formatDate(new Date(ticket.createdAt), {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Select
                                value={selectedStatus || ticket.status}
                                onValueChange={handleStatusChange}
                                disabled={statusLoading}
                            >
                                <SelectTrigger className={`w-full ${statusColors[selectedStatus || ticket.status]}`}>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="AWAITING_CUSTOMER">Awaiting Customer</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select
                                value={selectedPriority || ticket.priority}
                                onValueChange={handlePriorityChange}
                                disabled={priorityLoading}
                            >
                                <SelectTrigger className={`w-full ${priorityColors[selectedPriority || ticket.priority]}`}>
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low Priority</SelectItem>
                                    <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                                    <SelectItem value="HIGH">High Priority</SelectItem>
                                    <SelectItem value="URGENT">Urgent Priority</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-100">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={ticket.user?.image || ''} alt={ticket.user?.name || 'User'} />
                            <AvatarFallback>
                                <User className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <span className="font-medium text-lg">{ticket.user?.name || 'User'}</span>
                                <span className="text-sm text-blue-600">{ticket.user?.email}</span>
                            </div>

                            <div className="bg-white p-3 rounded border border-blue-100 mb-3">
                                <p className="whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                <span>User ID: {ticket.userId.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {ticket.replies.length > 0 && (
                    <div className="space-y-6 mb-8">
                        <h3 className="font-medium text-gray-700 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Support Conversation
                        </h3>

                        {ticket.replies.map((reply: any) => (
                            <div
                                key={reply.id}
                                className={`flex items-start gap-3 p-4 rounded-lg ${reply.isAdminReply
                                    ? 'bg-blue-50 border border-blue-100'
                                    : 'bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={reply.user?.image || ''} alt={reply.user?.name || 'User'} />
                                    <AvatarFallback>
                                        {reply.isAdminReply ? (
                                            <MessageSquare className="h-5 w-5" />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {reply.isAdminReply ? 'Support Team' : (reply.user?.name || 'User')}
                                        </span>
                                        <Badge variant="outline" className={reply.isAdminReply ? 'bg-blue-50' : ''}>
                                            {reply.isAdminReply ? 'Staff' : 'Customer'}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(new Date(reply.createdAt), {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSubmitReply} className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-700">Reply to Customer</h3>

                        <div className="flex gap-2">
                            <Select
                                onValueChange={(value) => setReply(prev => prev + value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Canned Responses" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cannedResponses.map((response, index) => (
                                        <SelectItem key={index} value={response.text}>
                                            {response.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={ticket.status === 'CLOSED'}
                                    >
                                        <MailCheck className="h-4 w-4 mr-1" />
                                        Resolve
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Resolve this ticket?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark the ticket as resolved. The customer can reopen it by responding.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleStatusChange('RESOLVED')}
                                        >
                                            Resolve Ticket
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={ticket.status === 'CLOSED'}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Close
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently close the ticket. The customer will need to create a new ticket for further assistance.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleStatusChange('CLOSED')}
                                        >
                                            Close Ticket
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your response to the customer here..."
                        className="h-32 mb-3"
                        disabled={isSubmitting || ticket.status === 'CLOSED'}
                    />

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !reply.trim() || ticket.status === 'CLOSED'}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Reply
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {ticket.status === 'CLOSED' && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center mt-4">
                        <p className="text-gray-600">
                            This ticket is closed. No further replies can be added.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}