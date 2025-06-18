"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
    const [message, setMessage] = useState('');
    const [isResending, setIsResending] = useState(false);

    const token = searchParams?.get('token');
    const email = searchParams?.get('email');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid verification link. Please check your email for the correct link.');
            return;
        }

        verifyEmail();
    }, [token, email]);

    const verifyEmail = async () => {
        try {
            setStatus('loading');

            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, email }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.alreadyVerified) {
                    setStatus('already-verified');
                    setMessage('Your email is already verified! You can now sign in to your account.');
                } else {
                    setStatus('success');
                    setMessage('Your email has been verified successfully! You can now sign in to your account.');
                }

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/auth/login?verified=true');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Email verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    const resendVerification = async () => {
        if (!email) return;

        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setMessage('A new verification email has been sent to your inbox.');
            } else {
                setMessage('Failed to resend verification email. Please try again later.');
            }
        } catch (error) {
            setMessage('Failed to resend verification email. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />;
            case 'success':
            case 'already-verified':
                return <CheckCircle className="h-16 w-16 text-green-600" />;
            case 'error':
                return <XCircle className="h-16 w-16 text-red-600" />;
            default:
                return <Mail className="h-16 w-16 text-gray-600" />;
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'loading':
                return 'Verifying Your Email...';
            case 'success':
                return 'Email Verified Successfully!';
            case 'already-verified':
                return 'Email Already Verified';
            case 'error':
                return 'Verification Failed';
            default:
                return 'Email Verification';
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center mb-4">
                        {getIcon()}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {getTitle()}
                    </h2>

                    <p className="text-gray-600 mb-6">
                        {message}
                    </p>

                    {status === 'loading' && (
                        <div className="space-y-2">
                            <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4 mx-auto"></div>
                            <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2 mx-auto"></div>
                        </div>
                    )}

                    {(status === 'success' || status === 'already-verified') && (
                        <div className="space-y-3">
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <p className="text-sm text-green-800">
                                    You will be redirected to the login page in a few seconds...
                                </p>
                            </div>

                            <Button asChild className="w-full">
                                <Link href="/auth/login?verified=true">
                                    Continue to Login
                                </Link>
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-sm text-red-800">
                                    {message}
                                </p>
                            </div>

                            <div className="space-y-2">
                                {email && (
                                    <Button
                                        onClick={resendVerification}
                                        disabled={isResending}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {isResending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Resend Verification Email'
                                        )}
                                    </Button>
                                )}

                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/auth/register">
                                        Back to Registration
                                    </Link>
                                </Button>

                                <Button asChild className="w-full">
                                    <Link href="/">
                                        Go Home
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
