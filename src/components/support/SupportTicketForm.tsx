"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, ChevronLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export function SupportTicketForm() {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!subject.trim()) {
            setError("Please enter a subject for your ticket");
            return;
        }

        if (description.trim().length < 20) {
            setError("Please provide more details about your issue (at least 20 characters)");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject,
                    description,
                    priority,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create ticket');
            }

            const data = await response.json();
            setSubmitted(true);
            toast.success('Support ticket created successfully');

            // Clear the form
            setSubject('');
            setDescription('');
            setPriority('MEDIUM');
        } catch (error) {
            console.error('Error creating ticket:', error);
            setError(error instanceof Error ? error.message : 'Failed to create ticket');
            toast.error(error instanceof Error ? error.message : 'Failed to create ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setSubject('');
        setDescription('');
        setPriority('MEDIUM');
        setError(null);
    };

    if (submitted) {
        return (
            <Card className="w-full">
                <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="text-green-700 flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Ticket Submitted Successfully
                    </CardTitle>
                    <CardDescription className="text-green-600">
                        Our support team will review your request and respond as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                    <p className="mb-4">
                        You can view the status of your ticket and communicate with our support team through your account's support section.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                        >
                            Submit Another Ticket
                        </Button>
                        <Button
                            onClick={() => router.push('/account/support/tickets')}
                        >
                            View My Tickets
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Submit a Support Request</CardTitle>
                <CardDescription>
                    Please provide as much detail as possible so we can help you quickly.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                            <span className="text-red-600">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="subject"
                            placeholder="Brief description of your issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="priority" className="text-sm font-medium">
                            Priority
                        </label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low Priority</SelectItem>
                                <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                                <SelectItem value="HIGH">High Priority</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Please select 'Urgent' only for issues that significantly impact your ability to use the platform.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            id="description"
                            placeholder="Please describe your issue in detail"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            minLength={20}
                            className="min-h-[200px]"
                        />
                        <p className="text-xs text-gray-500">
                            Include what you were doing when the issue occurred, any error messages, and steps to reproduce the problem.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : "Submit Ticket"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}