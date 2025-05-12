"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
    User,
    UserPlus,
    Search,
    ChevronDown,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Users,
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
    _count: {
        orders: number;
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<string>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, sortField, sortDirection]);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // This would be a real API call in a production environment
            // For now, we'll mock the data

            // Simulate API call with a timeout
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Mock data - in production, this would be fetched from the API
            const mockUsers: UserData[] = Array(25)
                .fill(null)
                .map((_, index) => ({
                    id: `user_${index + 1}`,
                    name: [
                        "John Smith",
                        "Emma Wilson",
                        "Michael Brown",
                        "Sarah Johnson",
                        "David Lee",
                        "Lisa Chen",
                        "Robert Kim",
                        "Jennifer Lopez",
                        "Thomas Wright",
                        "Amanda Davis"
                    ][index % 10],
                    email: `user${index + 1}@example.com`,
                    role: index < 3 ? "ADMIN" : "USER",
                    image: index % 3 === 0 ? `https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${(index % 10) + 1}.jpg` : null,
                    createdAt: new Date(Date.now() - (index * 86400000 * 3)).toISOString(),
                    updatedAt: new Date(Date.now() - (index * 43200000 * 3)).toISOString(),
                    _count: {
                        orders: Math.floor(Math.random() * 10)
                    }
                }));

            // Filter by role if needed
            let filteredUsers = [...mockUsers];
            if (roleFilter !== "all") {
                filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
            }

            // Sort users
            filteredUsers.sort((a, b) => {
                if (sortField === "name") {
                    return sortDirection === "asc"
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                } else if (sortField === "email") {
                    return sortDirection === "asc"
                        ? a.email.localeCompare(b.email)
                        : b.email.localeCompare(a.email);
                } else if (sortField === "orders") {
                    return sortDirection === "asc"
                        ? a._count.orders - b._count.orders
                        : b._count.orders - a._count.orders;
                } else {
                    // Default: sort by createdAt
                    return sortDirection === "asc"
                        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
            });

            // Pagination
            const itemsPerPage = 10;
            const totalItems = filteredUsers.length;
            setTotalPages(Math.ceil(totalItems / itemsPerPage));

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            setUsers(paginatedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would trigger an API call with the search term
        // For now, we'll just log it
        console.log("Searching for:", searchTerm);
        fetchUsers();
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Toggle sort direction if clicking the same field
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // Set new field and default to desc
            setSortField(field);
            setSortDirection("desc");
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <Button asChild>
                    <Link href="/admin/users/new">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </Link>
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </form>

                    <div className="flex flex-row gap-2">
                        <div>
                            <select
                                className="block w-full border border-gray-300 rounded-md px-3 py-2"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-md my-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-600">{error}</span>
                    </div>
                    <Button
                        variant="outline"
                        className="mt-2 text-red-600"
                        onClick={() => fetchUsers()}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? "Try adjusting your search terms" : "Start by adding a new user"}
                    </p>
                    <Button asChild>
                        <Link href="/admin/users/new">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center font-medium uppercase tracking-wider"
                                            onClick={() => handleSort("name")}
                                        >
                                            User
                                            {sortField === "name" && (
                                                <ChevronDown
                                                    className={`ml-1 h-4 w-4 transform ${sortDirection === "asc" ? "rotate-180" : ""
                                                        }`}
                                                />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center font-medium uppercase tracking-wider"
                                            onClick={() => handleSort("email")}
                                        >
                                            Email
                                            {sortField === "email" && (
                                                <ChevronDown
                                                    className={`ml-1 h-4 w-4 transform ${sortDirection === "asc" ? "rotate-180" : ""
                                                        }`}
                                                />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center font-medium uppercase tracking-wider"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            Joined
                                            {sortField === "createdAt" && (
                                                <ChevronDown
                                                    className={`ml-1 h-4 w-4 transform ${sortDirection === "asc" ? "rotate-180" : ""
                                                        }`}
                                                />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center font-medium uppercase tracking-wider"
                                            onClick={() => handleSort("orders")}
                                        >
                                            Orders
                                            {sortField === "orders" && (
                                                <ChevronDown
                                                    className={`ml-1 h-4 w-4 transform ${sortDirection === "asc" ? "rotate-180" : ""
                                                        }`}
                                                />
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {user.image ? (
                                                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                                            <Image
                                                                src={user.image}
                                                                alt={user.name}
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-gray-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <Link
                                                        href={`/admin/users/${user.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user._count.orders}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/users/${user.id}`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{" "}
                                        <span className="font-medium">{Math.min(page * 10, users.length * totalPages)}</span> of{" "}
                                        <span className="font-medium">{users.length * totalPages}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-l-md"
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </Button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Calculate page numbers to show
                                            let pageNumber: number;
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1;
                                            } else if (page <= 3) {
                                                pageNumber = i + 1;
                                            } else if (page >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i;
                                            } else {
                                                pageNumber = page - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={i}
                                                    variant={page === pageNumber ? "default" : "outline"}
                                                    size="sm"
                                                    className="hidden md:inline-flex"
                                                    onClick={() => setPage(pageNumber)}
                                                >
                                                    {pageNumber}
                                                </Button>
                                            );
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-r-md"
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            disabled={page === totalPages}
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </Button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}