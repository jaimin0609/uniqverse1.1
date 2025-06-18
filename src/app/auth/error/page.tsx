"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams?.get("error") ?? null;

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case "Configuration":
                return "There is a problem with the server configuration.";
            case "AccessDenied":
                return "Access denied. You do not have permission to sign in.";
            case "Verification":
                return "The verification token has expired or has already been used.";
            case "Default":
                return "An error occurred during authentication.";
            case "Signin":
                return "Error in signin.";
            case "OAuthSignin":
                return "Error in trying to sign in via OAuth.";
            case "OAuthCallback":
                return "Error in handling the response from OAuth provider.";
            case "OAuthCreateAccount":
                return "Could not create OAuth account in the database.";
            case "EmailCreateAccount":
                return "Could not create email account in the database.";
            case "Callback":
                return "Error in the OAuth callback handler route.";
            case "OAuthAccountNotLinked":
                return "Email already exists with different account. Please sign in with your original method.";
            case "EmailSignin":
                return "Check your email for a signin link.";
            case "CredentialsSignin":
                return "Invalid credentials.";
            case "SessionRequired":
                return "Please sign in to access this page.";
            default:
                return "An unknown error occurred.";
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Authentication Error
                    </h2>

                    <p className="text-gray-600 mb-6">
                        {getErrorMessage(error)}
                    </p>

                    {error && (
                        <div className="bg-gray-100 p-4 rounded-md mb-6">
                            <p className="text-sm text-gray-700">
                                <strong>Error Code:</strong> {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/auth/login">
                                Try Again
                            </Link>
                        </Button>

                        <Button variant="outline" asChild className="w-full">
                            <Link href="/">
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
