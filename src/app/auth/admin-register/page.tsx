"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Secure admin registration page that requires a special registration code
 * This prevents unauthorized users from creating admin accounts
 */
export default function AdminRegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        registrationCode: "" // Special code required for admin registration
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    // This would normally be stored securely in an environment variable
    // For demo purposes, it's hardcoded here
    const ADMIN_REGISTRATION_CODE = "UNIQVERSE-ADMIN-2025";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

        // Clear server error when any field is edited
        if (serverError) {
            setServerError("");
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        // Registration code validation
        if (!formData.registrationCode) {
            newErrors.registrationCode = "Registration code is required";
        } else if (formData.registrationCode !== ADMIN_REGISTRATION_CODE) {
            newErrors.registrationCode = "Invalid registration code";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setServerError("");

        try {
            const response = await fetch("/api/auth/admin-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    registrationCode: formData.registrationCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Registration failed");
            }

            // Registration successful
            router.push("/auth/login?registered=true&admin=true");
        } catch (error) {
            console.error("Registration error:", error);
            setServerError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Admin Registration
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Create a secure administrator account
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
                    {serverError && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="text-sm text-red-700">{serverError}</div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Name field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Full Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    className={`block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm ${errors.name ? "border-red-500" : "border-gray-300"
                                        } placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm`}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                        </div>

                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    className={`block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm ${errors.email ? "border-red-500" : "border-gray-300"
                                        } placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Password
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

                        {/* Confirm Password field */}
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
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        {/* Registration Code field */}
                        <div>
                            <label htmlFor="registrationCode" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin Registration Code
                            </label>
                            <div className="mt-1">
                                <input
                                    id="registrationCode"
                                    name="registrationCode"
                                    type="text"
                                    value={formData.registrationCode}
                                    onChange={handleChange}
                                    className={`block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm ${errors.registrationCode ? "border-red-500" : "border-gray-300"
                                        } placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm`}
                                />
                                {errors.registrationCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.registrationCode}</p>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Required for admin registration. Obtain this code from your system administrator.
                            </p>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    "Register Admin Account"
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}