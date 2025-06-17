"use client";

import { useState, useEffect } from "react";
import {
    User,
    MoreHorizontal,
    UserCog,
    Mail,
    Calendar,
    Loader2,
    AlertTriangle,
    Search,
    UserPlus,
    Filter,
    Download,
    ShoppingBag,
    CreditCard,
    PlusCircle,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CustomerData {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    role: string;
    orderCount: number;
    totalSpent: number;
}

interface PaginationData {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false); const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams?.get("page") || "1", 10);
    const currentRole = searchParams?.get("role") || "all";

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch customers data
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    role: currentRole,
                    search: debouncedSearchTerm
                });

                const response = await fetch(`/api/admin/customers?${params.toString()}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch customers");
                }

                const data = await response.json();
                setCustomers(data.customers);
                setPagination(data.pagination);
            } catch (err) {
                console.error("Error fetching customers:", err);
                setError("Failed to load customers. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, [currentPage, currentRole, debouncedSearchTerm]); const handlePageChange = (page: number) => {
        if (page < 1 || page > pagination.totalPages) return;

        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("page", page.toString());

        router.push(`/admin/customers?${params.toString()}`);
    };

    const handleRoleFilter = (role: string) => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("role", role);
        params.delete("page"); // Reset to first page when changing filters

        router.push(`/admin/customers?${params.toString()}`);
    };

    // Export customers to CSV
    const exportCustomers = () => {
        // Convert customers data to CSV format
        const headers = ["Name", "Email", "Role", "Registered Date", "Orders", "Total Spent"];
        const csvData = customers.map(customer => [
            customer.name || "Unnamed",
            customer.email,
            customer.role,
            format(new Date(customer.createdAt), "yyyy-MM-dd"),
            customer.orderCount.toString(),
            `$${customer.totalSpent.toFixed(2)}`
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(","),
            ...csvData.map(row => row.join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `customers-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Customers data exported successfully");
    };

    // Handle delete customer
    const handleDeleteCustomer = (customer: CustomerData) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    // Confirm delete customer
    const confirmDeleteCustomer = async () => {
        if (!customerToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete customer');
            }

            // Remove the customer from the list
            setCustomers(customers.filter(c => c.id !== customerToDelete.id));
            toast.success(`${customerToDelete.name || 'Customer'} has been removed`);

            // Update pagination if needed
            if (customers.length === 1 && currentPage > 1) {
                handlePageChange(currentPage - 1);
            } else if (pagination.total > 0) {
                setPagination({
                    ...pagination,
                    total: pagination.total - 1
                });
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            toast.error('Failed to delete customer. Please try again.');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
        }
    };

    if (isLoading && customers.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Customers</h1>
                    <p className="text-gray-500 text-sm">
                        Manage your customers and their data
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportCustomers}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/admin/customers/create">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Customer
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="w-full sm:w-48">
                    <Select
                        defaultValue={currentRole}
                        onValueChange={handleRoleFilter}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="CUSTOMER">Customers</SelectItem>
                            <SelectItem value="ADMIN">Admins</SelectItem>
                            <SelectItem value="VENDOR">Vendors</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                            <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <Link
                                            href={`/admin/customers/${customer.id}`}
                                            className="flex items-start gap-3 py-1"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{customer.name || "Unnamed User"}</div>
                                                <div className="text-sm text-gray-500">{customer.email}</div>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            customer.role === "ADMIN" ? "secondary" :
                                                customer.role === "VENDOR" ? "outline" : "default"
                                        }>
                                            {customer.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(customer.createdAt), "MMM d, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <ShoppingBag className="h-4 w-4 text-gray-400 mr-1.5" />
                                            <span>{customer.orderCount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            <CreditCard className="h-4 w-4 text-gray-400 mr-1.5" />
                                            <span>${customer.totalSpent.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border shadow-md">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/customers/${customer.id}`}>
                                                        <User className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/customers/${customer.id}/edit`}>
                                                        <UserCog className="h-4 w-4 mr-2" />
                                                        Edit Customer
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/customers/${customer.id}#orders`}>
                                                        <ShoppingBag className="h-4 w-4 mr-2" />
                                                        View Orders
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteCustomer(customer)}
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Customer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No customers found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>

                    <span className="mx-2 text-sm text-gray-600">
                        Page {currentPage} of {pagination.totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                    >
                        Next
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={currentPage === pagination.totalPages}
                    >
                        Last
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteCustomer} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}