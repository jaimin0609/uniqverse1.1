"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { toast } from "sonner";
import type { z } from "zod";

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(data: ResetFormValues) {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Something went wrong");
            }

            setIsEmailSent(true);
            toast.success("Password reset instructions sent to your email address");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send reset email");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Form Section */}
            <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
                <div className="mx-auto w-full max-w-sm lg:max-w-md">
                    <div className="text-center lg:text-left">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                Uniqverse
                            </span>
                        </Link>
                    </div>

                    <div className="mt-8">
                        <div className="mt-6">
                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                                Reset your password
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                {isEmailSent
                                    ? "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
                                    : "Enter the email address associated with your account, and we'll send you a link to reset your password."}
                            </p>
                        </div>

                        {!isEmailSent ? (
                            <div className="mt-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Email address
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="email"
                                                type="email"
                                                autoComplete="email"
                                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                                {...register("email")}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending reset link...
                                                </>
                                            ) : (
                                                "Send reset link"
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <Button
                                    className="w-full"
                                    onClick={() => setIsEmailSent(false)}
                                >
                                    Send again
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                <Link
                                    href="/auth/login"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Back to login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Section */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-400 to-indigo-500">
                    <div className="flex h-full items-center justify-center p-12">
                        <div className="max-w-lg">
                            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
                                Forgot your password?
                            </h2>
                            <p className="mt-4 text-xl text-white opacity-90">
                                No problem. We'll help you securely reset your password and get back to shopping.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
