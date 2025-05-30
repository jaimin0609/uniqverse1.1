"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";

const resetPasswordConfirmSchema = z
    .object({
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters" })
            .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
            .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
            .regex(/[0-9]/, { message: "Password must contain at least one number" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [isLoading, setIsLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isTokenChecking, setIsTokenChecking] = useState(true);
    const [tokenError, setTokenError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<{
        password?: string;
        confirmPassword?: string;
    }>({});

    // Verify token validity
    useEffect(() => {
        if (!token || !email) {
            setIsTokenChecking(false);
            setTokenError("Invalid password reset link. Please request a new one.");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(`/api/auth/verify-reset-token?token=${token}&email=${encodeURIComponent(email)}`);

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || "Invalid or expired token");
                }

                setIsTokenValid(true);
            } catch (error) {
                setTokenError(error instanceof Error ? error.message : "Token verification failed");
            } finally {
                setIsTokenChecking(false);
            }
        };

        verifyToken();
    }, [token, email]);

    const validateForm = () => {
        try {
            resetPasswordConfirmSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path) {
                        formattedErrors[err.path[0]] = err.message;
                    }
                });
                setErrors(formattedErrors);
            }
            return false;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear specific field error when the user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    email,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to reset password");
            }

            // Success
            toast.success("Your password has been reset successfully");

            // Redirect to login with success message
            router.push("/auth/login?reset=success");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Password reset failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (isTokenChecking) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Verifying your reset link...</p>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                    <h2 className="mb-4 text-center text-2xl font-bold text-red-600">Invalid Reset Link</h2>
                    <p className="mb-6 text-center text-gray-600">{tokenError}</p>
                    <div className="flex justify-center">
                        <Link href="/auth/forgot-password">
                            <Button>Request New Reset Link</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
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
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Set new password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter and confirm your new password below
                        </p>

                        <div className="mt-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                        New Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            className={`block w-full rounded-md border px-3 py-2 pr-10 text-gray-900 shadow-sm ${errors.password ? "border-red-500" : "border-gray-300"
                                                } placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Must be at least 8 characters with uppercase, lowercase, and numbers.
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                                        Confirm Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            className={`block w-full rounded-md border px-3 py-2 pr-10 text-gray-900 shadow-sm ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                                                } placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOffIcon className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Resetting password...
                                            </>
                                        ) : (
                                            "Reset password"
                                        )}
                                    </Button>
                                </div>
                            </form>
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
                                Secure your account
                            </h2>
                            <p className="mt-4 text-xl text-white opacity-90">
                                Create a strong password to protect your Uniqverse account and get back to shopping.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
