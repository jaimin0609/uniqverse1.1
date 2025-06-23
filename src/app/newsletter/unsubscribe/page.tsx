'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnsubscribePage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams?.get('token');
        const emailParam = searchParams?.get('email');

        if (token && emailParam) {
            // Automatic unsubscribe via link
            handleAutoUnsubscribe(token, emailParam);
        } else {
            // Manual unsubscribe form
            setStatus('manual');
        }
    }, [searchParams]);

    const handleAutoUnsubscribe = async (token: string, emailParam: string) => {
        try {
            const response = await fetch(`/api/newsletter/unsubscribe?token=${token}&email=${encodeURIComponent(emailParam)}`);
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setStatus('success');
            } else {
                setMessage(data.error || 'Failed to unsubscribe');
                setStatus('error');
            }
        } catch (error) {
            console.error('Unsubscribe error:', error);
            setMessage('Something went wrong. Please try again later.');
            setStatus('error');
        }
    };

    const handleManualUnsubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage('Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('/api/newsletter/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setStatus('success');
                setEmail('');
            } else {
                setMessage(data.error || 'Failed to unsubscribe');
                setStatus('error');
            }
        } catch (error) {
            console.error('Manual unsubscribe error:', error);
            setMessage('Something went wrong. Please try again later.');
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Newsletter Unsubscribe
                    </h1>

                    {status === 'loading' && (
                        <div className="flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600">Processing your unsubscribe request...</span>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-600 mb-6">{message}</p>
                            <p className="text-gray-600 mb-6">
                                We're sorry to see you go! If you change your mind, you can always resubscribe from our homepage.
                            </p>
                            <Link href="/">
                                <Button>Return to Homepage</Button>
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-red-600 mb-6">{message}</p>
                            <div className="space-y-3">
                                <Link href="/">
                                    <Button variant="outline" className="w-full">Return to Homepage</Button>
                                </Link>
                                <Button
                                    onClick={() => setStatus('manual')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Try Manual Unsubscribe
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === 'manual' && (
                        <div>
                            <p className="text-gray-600 mb-6">
                                Enter your email address to unsubscribe from our newsletter.
                            </p>
                            <form onSubmit={handleManualUnsubscribe} className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isSubmitting}
                                />                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !email.trim()}
                                    className="w-full bg-white text-black border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:hover:text-gray-400"
                                >
                                    {isSubmitting ? 'Unsubscribing...' : 'Unsubscribe'}
                                </Button>
                            </form>
                            {message && (
                                <div className={`mt-4 p-3 rounded-md text-sm ${message.includes('successfully') || message.includes('unsubscribed')
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm">
                                    ← Back to Homepage
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
