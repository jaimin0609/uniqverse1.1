"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    // Check for reset password success message or registration success
    const resetSuccess = searchParams.get("reset") === "success";
    const registeredSuccess = searchParams.get("registered") === "true";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    }); async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid credentials. Please try again.");
                setIsLoading(false);
                return;
            }

            toast.success("Login successful!");

            // Use window.location.href for more reliable navigation in tests
            window.location.href = "/";
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Login Form */}
            <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
                <div className="mx-auto w-full max-w-sm lg:max-w-md">
                    <div className="text-center lg:text-left">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                Uniqverse
                            </span>
                        </Link>                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Welcome back
                        </h2>

                        {/* Success Messages */}
                        {resetSuccess && (
                            <div className="mt-4 rounded-md bg-green-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">
                                            Password reset successful! You can now log in with your new password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {registeredSuccess && (
                            <div className="mt-4 rounded-md bg-green-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">
                                            Registration successful! Please log in to your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="mt-2 text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link
                                href="/auth/register"
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="mt-6">
                            <div className="space-y-6">
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
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Password
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="password"
                                                type="password"
                                                autoComplete="current-password"
                                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                                {...register("password")}
                                            />
                                        </div>
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label
                                                htmlFor="remember-me"
                                                className="ml-2 block text-sm text-gray-900"
                                            >
                                                Remember me
                                            </label>
                                        </div>

                                        <div className="text-sm">
                                            <Link
                                                href="/auth/forgot-password"
                                                className="font-medium text-blue-600 hover:text-blue-500"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                    </div>

                                    <div>                                        <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                        data-testid="login-submit-button"
                                    >
                                        {isLoading ? "Signing in..." : "Sign in"}
                                    </Button>
                                    </div>
                                </form>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-gray-500">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => signIn("google", {
                                            callbackUrl: "/",
                                            redirect: true
                                        })}
                                        disabled={isLoading}
                                    >
                                        <svg
                                            className="mr-2 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 48 48"
                                        >
                                            <path
                                                fill="#FFC107"
                                                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                                            />
                                            <path
                                                fill="#FF3D00"
                                                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                                            />
                                            <path
                                                fill="#4CAF50"
                                                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                                            />
                                            <path
                                                fill="#1976D2"
                                                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                                            />
                                        </svg>
                                        Sign in with Google
                                    </Button>
                                </div>
                            </div>
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
                                Shop Unique, <br />
                                Live Unique
                            </h2>
                            <p className="mt-4 text-xl text-white opacity-90">
                                Discover custom-designed products that reflect your unique personality.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}