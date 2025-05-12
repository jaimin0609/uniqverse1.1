"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AccountSettingsPage() {
    const router = useRouter();
    const { data: session, status, update } = useSession();

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [formData, setFormData] = useState({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Helper function to get role badge styling
    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN":
                return {
                    color: "bg-purple-100 text-purple-800 border-purple-200",
                    icon: <ShieldAlert className="h-4 w-4 mr-1" />
                };
            case "VENDOR":
                return {
                    color: "bg-blue-100 text-blue-800 border-blue-200",
                    icon: <ShieldAlert className="h-4 w-4 mr-1" />
                };
            default:
                return {
                    color: "bg-green-100 text-green-800 border-green-200",
                    icon: <CheckCircle className="h-4 w-4 mr-1" />
                };
        }
    };

    // Get role styling
    const roleBadge = getRoleBadge(session?.user?.role || "customer");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: "", type: "" });

        try {
            // Validate form
            if (!formData.name || !formData.email) {
                throw new Error("Name and email are required");
            }

            // If changing password, validate password fields
            if (formData.newPassword || formData.confirmPassword) {
                if (!formData.currentPassword) {
                    throw new Error("Current password is required to change password");
                }

                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error("New passwords do not match");
                }

                if (formData.newPassword.length < 8) {
                    throw new Error("New password must be at least 8 characters");
                }
            }

            // Make API request to update account
            const response = await fetch("/api/users/account", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    currentPassword: formData.currentPassword || undefined,
                    newPassword: formData.newPassword || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update account settings");
            }

            // Update session with new user data
            const result = await response.json();
            update({
                ...session,
                user: {
                    ...session?.user,
                    name: formData.name,
                    email: formData.email,
                },
            });

            // Reset password fields
            setFormData({
                ...formData,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setMessage({
                text: "Account settings updated successfully",
                type: "success",
            });
        } catch (error) {
            setMessage({
                text: error instanceof Error ? error.message : "An error occurred",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch("/api/users/account", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete account");
            }

            // Sign out and redirect to home page
            router.push("/api/auth/signout?callbackUrl=/");
        } catch (error) {
            setMessage({
                text: error instanceof Error ? error.message : "Failed to delete account",
                type: "error",
            });
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/auth/login?callbackUrl=/account/settings");
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                {/* User Role Badge */}
                <div className="p-6 border-b">
                    <div className="mb-2 text-sm font-medium text-gray-600">Account Type</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${roleBadge.color}`}>
                        {roleBadge.icon}
                        <span className="font-medium capitalize">
                            {session?.user?.role || "Customer"}
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        {session?.user?.role === "admin"
                            ? "You have full administrative access to the platform."
                            : session?.user?.role === "vendor"
                                ? "You can manage products and view sales data."
                                : "Standard customer account with shopping privileges."}
                    </p>
                </div>

                {message.text && (
                    <div
                        className={`p-4 ${message.type === "success"
                            ? "bg-green-50 border-l-4 border-green-500 text-green-700"
                            : "bg-red-50 border-l-4 border-red-500 text-red-700"
                            }`}
                    >
                        <div className="flex items-center">
                            {message.type === "success" ? (
                                <CheckCircle className="h-5 w-5 mr-2" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 mr-2" />
                            )}
                            <p>{message.text}</p>
                        </div>
                    </div>
                )}

                <form className="p-6" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name Field */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium mb-4">Change Password</h3>

                            {/* Current Password */}
                            <div className="mb-4">
                                <label
                                    htmlFor="currentPassword"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Current Password
                                </label>
                                <input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* New Password */}
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        New Password
                                    </label>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Minimum 8 characters
                                    </p>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-red-100 bg-red-50">
                    <h2 className="text-lg font-medium text-red-700">Danger Zone</h2>
                    <p className="mt-1 text-sm text-red-600">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                </div>

                <div className="p-6">
                    {!showDeleteConfirm ? (
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Account
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                    <p className="text-sm text-red-700">
                                        Are you sure you want to permanently delete your account? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <Button
                                    variant="destructive"
                                    disabled={isDeleting}
                                    onClick={handleDeleteAccount}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Yes, Delete My Account"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}