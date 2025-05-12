"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, CheckCircle, XCircle, Settings, ExternalLink, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

interface Supplier {
    id: string;
    name: string;
    description: string | null;
    website: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: string;
    updatedAt: string;
    productsCount?: number;
    lastOrderDate?: string;
}

export default function SuppliersPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [lastTestResults, setLastTestResults] = useState<{ [key: string]: { success: boolean, timestamp: string } }>({});

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/suppliers");
            if (!response.ok) {
                throw new Error("Failed to fetch suppliers");
            }
            const data = await response.json();
            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        } finally {
            setIsLoading(false);
        }
    };

    const testSupplierConnection = async (supplierId: string) => {
        try {
            const response = await fetch(`/api/admin/suppliers/${supplierId}/test-connection`, {
                method: "POST",
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`Successfully connected to ${result.supplierName}`);
                setLastTestResults(prev => ({
                    ...prev,
                    [supplierId]: { success: true, timestamp: new Date().toISOString() }
                }));
            } else {
                toast.error(`Connection failed: ${result.error}`);
                setLastTestResults(prev => ({
                    ...prev,
                    [supplierId]: { success: false, timestamp: new Date().toISOString() }
                }));
            }
        } catch (error) {
            console.error("Error testing supplier connection:", error);
            toast.error("Failed to test connection");
            setLastTestResults(prev => ({
                ...prev,
                [supplierId]: { success: false, timestamp: new Date().toISOString() }
            }));
        }
    };

    const updateSupplierStatus = async (supplierId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update supplier status");
            }

            toast.success("Supplier status updated");
            fetchSuppliers(); // Refresh the list
        } catch (error) {
            console.error("Error updating supplier status:", error);
            toast.error("Failed to update supplier status");
        }
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplier.description && supplier.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (supplier.contactEmail && supplier.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge variant="success" className="bg-green-500">Active</Badge>;
            case "INACTIVE":
                return <Badge variant="secondary">Inactive</Badge>;
            case "SUSPENDED":
                return <Badge variant="destructive">Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title="Supplier Management"
                description="Manage your dropshipping suppliers and their API connections"
                actions={
                    <Button onClick={() => router.push("/admin/suppliers/add")} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Supplier
                    </Button>
                }
            />

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Dropshipping Statistics</CardTitle>
                    <CardDescription>Overview of your supplier performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg bg-slate-50">
                            <div className="text-sm text-gray-500">Total Suppliers</div>
                            <div className="text-2xl font-bold">{suppliers.length}</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-slate-50">
                            <div className="text-sm text-gray-500">Active Suppliers</div>
                            <div className="text-2xl font-bold">
                                {suppliers.filter(s => s.status === "ACTIVE").length}
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-slate-50">
                            <div className="text-sm text-gray-500">Connected APIs</div>
                            <div className="text-2xl font-bold">
                                {suppliers.filter(s => s.apiEndpoint && s.apiKey).length}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search suppliers..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchSuppliers}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>
                        Manage your dropshipping supplier connections and API integrations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <RotateCw className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            {searchTerm || statusFilter !== "all" ? (
                                <p>No suppliers found matching your filters.</p>
                            ) : (
                                <div>
                                    <p className="mb-4">No suppliers added yet.</p>
                                    <Button onClick={() => router.push("/admin/suppliers/add")}>
                                        Add Your First Supplier
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>API Connected</TableHead>
                                        <TableHead>Products</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSuppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">
                                                <div>{supplier.name}</div>
                                                {supplier.website && (
                                                    <a
                                                        href={supplier.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-500 flex items-center mt-1"
                                                    >
                                                        {supplier.website.replace(/(^\w+:|^)\/\//, '')}
                                                        <ExternalLink className="h-3 w-3 ml-1" />
                                                    </a>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(supplier.status)}
                                            </TableCell>
                                            <TableCell>
                                                {supplier.apiEndpoint && supplier.apiKey ? (
                                                    <div className="flex flex-col">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-1">
                                                            <CheckCircle className="h-3 w-3 mr-1" /> Connected
                                                        </Badge>
                                                        {lastTestResults[supplier.id] && (
                                                            <span className="text-xs text-gray-500">
                                                                Last tested: {new Date(lastTestResults[supplier.id].timestamp).toLocaleString()}
                                                                {lastTestResults[supplier.id].success ?
                                                                    <CheckCircle className="h-3 w-3 ml-1 inline text-green-500" /> :
                                                                    <XCircle className="h-3 w-3 ml-1 inline text-red-500" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        <XCircle className="h-3 w-3 mr-1" /> Not Connected
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {supplier.productsCount || 0}
                                            </TableCell>
                                            <TableCell>
                                                {supplier.contactEmail && (
                                                    <div className="text-sm">{supplier.contactEmail}</div>
                                                )}
                                                {supplier.contactPhone && (
                                                    <div className="text-xs text-gray-500">{supplier.contactPhone}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => testSupplierConnection(supplier.id)}
                                                        disabled={!supplier.apiEndpoint || !supplier.apiKey}
                                                    >
                                                        Test API
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin/suppliers/${supplier.id}`)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Select
                                                        value={supplier.status}
                                                        onValueChange={(value) => updateSupplierStatus(supplier.id, value)}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-9">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}