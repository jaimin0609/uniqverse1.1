"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
    User,
    ArrowLeft,
    Save,
    Trash2,
    Loader2,
    AlertTriangle,
    ShoppingBag,
    Calendar
} from "lucide-react";
import { format } from "date-fns";

// User type definition
interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    orders: {
        id: string;
        total: number;
        status: string;
        createdAt: string;
    }[];
    _count: {
        orders: number;
    };
}

interface Order {
    id: string;
    total: number;
    status: string;
    createdAt: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("USER");
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        const initializeParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        initializeParams();
    }, [params]);

    useEffect(() => {
        if (!resolvedParams) return;
        fetchUser();
    }, [resolvedParams]); const fetchUser = async () => {
        if (!resolvedParams) return;

        setIsLoading(true);
        setError(null);

        try {
            // Simulate API call with timeout
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Mock data - in production, this would be fetched from the API
            if (resolvedParams.id === "new") {
                setUser(null);
                setName("");
                setEmail("");
                setRole("USER");
                setImage(null);
            } else {
                const mockUser: UserData = {
                    id: resolvedParams.id,
                    name: "John Smith",
                    email: "john@example.com",
                    role: resolvedParams.id === "user_1" ? "ADMIN" : "USER",
                    image: resolvedParams.id === "user_1" ? "https://randomuser.me/api/portraits/men/1.jpg" : null,
                    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
                    updatedAt: new Date().toISOString(),
                    orders: [
                        {
                            id: "order_1",
                            total: 199.99,
                            status: "DELIVERED",
                            createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
                        },
                        {
                            id: "order_2",
                            total: 59.99,
                            status: "PROCESSING",
                            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                        },
                    ],
                    _count: {
                        orders: 2,
                    },
                };

                setUser(mockUser);
                setName(mockUser.name);
                setEmail(mockUser.email);
                setRole(mockUser.role);
                setImage(mockUser.image);
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setError("Failed to load user data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setIsSaving(true);

        // Validate form
        if (!name.trim()) {
            setFormError("Name is required");
            setIsSaving(false);
            return;
        }

        if (!email.trim() || !email.includes("@")) {
            setFormError("Valid email is required");
            setIsSaving(false);
            return;
        }

        try {
            // Simulate API call with timeout
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (resolvedParams?.id === "new") {
                // This would be a POST request in production
                console.log("Creating new user:", { name, email, role, image });

                // Simulate success and redirect
                router.push("/admin/users");
            } else {
                // This would be a PUT request in production
                console.log("Updating user:", { name, email, role, image });

                // Update local state to simulate success
                if (user) {
                    setUser({
                        ...user,
                        name,
                        email,
                        role,
                        image,
                        updatedAt: new Date().toISOString(),
                    });
                }
            }

            // Show success message
            // In production you would use a toast notification
            alert(resolvedParams?.id === "new" ? "User created successfully!" : "User updated successfully!");
        } catch (err) {
            console.error("Error saving user:", err);
            setFormError("Failed to save user data. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;

        // Confirm deletion
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);

        try {
            // Simulate API call with timeout
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Deleting user:", user.id);

            // Redirect on success
            router.push("/admin/users");

            // Show success message
            // In production you would use a toast notification
            alert("User deleted successfully!");
        } catch (err) {
            console.error("Error deleting user:", err);
            setFormError("Failed to delete user. Please try again.");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md my-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-600">{error}</span>
                </div>
                <Button
                    variant="outline"
                    className="mt-2 text-red-600"
                    onClick={() => fetchUser()}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="sm" asChild className="mr-4">
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Users
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {resolvedParams?.id === "new" ? "Create New User" : "Edit User"}
                </h1>
            </div>

            {/* User form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <form onSubmit={handleSubmit}>
                            {formError && (
                                <div className="bg-red-50 p-3 rounded-md mb-4">
                                    <div className="flex items-center">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                        <span className="text-red-600 text-sm">{formError}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="role"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="image"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Profile Image URL (optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="image"
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={image || ""}
                                        onChange={(e) => setImage(e.target.value || null)}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <div>
                                        {resolvedParams?.id !== "new" && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-600 hover:bg-red-50"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                )}
                                                Delete User
                                            </Button>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {resolvedParams?.id === "new" ? "Create User" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div>
                    {resolvedParams?.id !== "new" && user && (
                        <>
                            {/* User profile card */}
                            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                                <div className="flex flex-col items-center">
                                    <div className="h-24 w-24 mb-4">
                                        {user.image ? (
                                            <div className="relative h-24 w-24 rounded-full overflow-hidden">
                                                <Image
                                                    src={user.image}
                                                    alt={user.name}
                                                    fill
                                                    sizes="96px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="h-12 w-12 text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                                    <p className="text-gray-500 mb-2">{user.email}</p>
                                    <span
                                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${user.role === "ADMIN"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-blue-100 text-blue-800"
                                            }`}
                                    >
                                        {user.role}
                                    </span>
                                </div>

                                <div className="border-t border-gray-200 mt-6 pt-4">
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        Member since {format(new Date(user.createdAt), "MMMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <ShoppingBag className="h-4 w-4 mr-1" />
                                        {user._count.orders} {user._count.orders === 1 ? "order" : "orders"} placed
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            {user.orders && user.orders.length > 0 && (
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h3 className="font-medium text-gray-900 mb-3">Recent Orders</h3>
                                    <div className="space-y-3">
                                        {user.orders.map((order) => (
                                            <div key={order.id} className="border border-gray-200 rounded-md p-3">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Order #{order.id.slice(0, 8)}
                                                </Link>
                                                <div className="flex justify-between items-center mt-1 text-sm">
                                                    <span className="text-gray-500">
                                                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                    </span>
                                                    <span className="font-medium">${order.total.toFixed(2)}</span>
                                                </div>
                                                <div className="mt-1">
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded-full ${order.status === "DELIVERED"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status === "PROCESSING"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {user._count.orders > user.orders.length && (
                                        <div className="mt-3 text-center">
                                            <Button variant="link" asChild>
                                                <Link href={`/admin/users/${user.id}/orders`}>
                                                    View all orders
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}