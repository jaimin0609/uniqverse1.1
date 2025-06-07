"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Trash2, Search, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CustomDesign {
    id: string;
    userId: string;
    productId: string;
    designData: {
        elements: Array<{
            type: string;
            data: any;
        }>;
    };
    previewUrl?: string;
    status: 'draft' | 'saved' | 'ordered';
    createdAt: string;
    updatedAt: string;
    user: {
        name: string;
        email: string;
    };
    product: {
        name: string;
        slug: string;
    };
    orderItem?: {
        orderId: string;
        quantity: number;
    };
}

export default function CustomDesignsPage() {
    const [designs, setDesigns] = useState<CustomDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDesign, setSelectedDesign] = useState<CustomDesign | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");

    useEffect(() => {
        fetchDesigns();
    }, []);

    const fetchDesigns = async () => {
        try {
            // Mock data for now - replace with actual API call
            const mockDesigns: CustomDesign[] = [
                {
                    id: "design_1",
                    userId: "user_1",
                    productId: "product_1",
                    designData: {
                        elements: [
                            {
                                type: "text",
                                data: {
                                    text: "My Custom Design",
                                    fontSize: 24,
                                    color: "#000000",
                                    fontFamily: "Arial",
                                    x: 100,
                                    y: 100
                                }
                            },
                            {
                                type: "shape",
                                data: {
                                    type: "circle",
                                    fill: "#ff0000",
                                    radius: 50,
                                    x: 150,
                                    y: 200
                                }
                            }
                        ]
                    },
                    previewUrl: "/placeholder-product.jpg",
                    status: "ordered",
                    createdAt: "2025-05-30T10:30:00Z",
                    updatedAt: "2025-05-30T11:00:00Z",
                    user: {
                        name: "John Doe",
                        email: "john@example.com"
                    },
                    product: {
                        name: "Custom T-Shirt",
                        slug: "custom-t-shirt"
                    },
                    orderItem: {
                        orderId: "order_123",
                        quantity: 1
                    }
                },
                {
                    id: "design_2",
                    userId: "user_2",
                    productId: "product_2",
                    designData: {
                        elements: [
                            {
                                type: "text",
                                data: {
                                    text: "Cool Hoodie",
                                    fontSize: 32,
                                    color: "#ffffff",
                                    fontFamily: "Georgia",
                                    x: 120,
                                    y: 150
                                }
                            },
                            {
                                type: "image",
                                data: {
                                    src: "/placeholder-product.jpg",
                                    width: 100,
                                    height: 100,
                                    x: 175,
                                    y: 200
                                }
                            }
                        ]
                    },
                    previewUrl: "/placeholder-product.jpg",
                    status: "saved",
                    createdAt: "2025-05-30T14:15:00Z",
                    updatedAt: "2025-05-30T14:30:00Z",
                    user: {
                        name: "Jane Smith",
                        email: "jane@example.com"
                    },
                    product: {
                        name: "Custom Hoodie",
                        slug: "custom-hoodie"
                    }
                },
                {
                    id: "design_3",
                    userId: "user_3",
                    productId: "product_1",
                    designData: {
                        elements: [
                            {
                                type: "text",
                                data: {
                                    text: "Draft Design",
                                    fontSize: 20,
                                    color: "#333333",
                                    fontFamily: "Helvetica",
                                    x: 80,
                                    y: 120
                                }
                            }
                        ]
                    },
                    previewUrl: "/placeholder-product.jpg",
                    status: "draft",
                    createdAt: "2025-05-31T09:00:00Z",
                    updatedAt: "2025-05-31T09:15:00Z",
                    user: {
                        name: "Mike Johnson",
                        email: "mike@example.com"
                    },
                    product: {
                        name: "Custom T-Shirt",
                        slug: "custom-t-shirt"
                    }
                }
            ];
            setDesigns(mockDesigns);
        } catch (error) {
            console.error('Error fetching designs:', error);
            toast.error('Failed to load designs');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDesign = async (id: string) => {
        if (!confirm('Are you sure you want to delete this design?')) return;

        try {
            setDesigns(prev => prev.filter(d => d.id !== id));
            toast.success('Design deleted successfully');
        } catch (error) {
            console.error('Error deleting design:', error);
            toast.error('Failed to delete design');
        }
    };

    const handleDownloadDesign = async (design: CustomDesign) => {
        try {
            // In a real implementation, this would generate and download the design file
            const designJson = JSON.stringify(design.designData, null, 2);
            const blob = new Blob([designJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `design_${design.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Design downloaded successfully');
        } catch (error) {
            console.error('Error downloading design:', error);
            toast.error('Failed to download design');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'saved': return 'bg-blue-100 text-blue-800';
            case 'ordered': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredDesigns = designs.filter(design => {
        const matchesSearch = searchTerm === "" ||
            design.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.product.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || design.status === statusFilter;

        const matchesDate = dateFilter === "all" || (() => {
            const designDate = new Date(design.createdAt);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - designDate.getTime()) / (1000 * 60 * 60 * 24));

            switch (dateFilter) {
                case "today": return daysDiff === 0;
                case "week": return daysDiff <= 7;
                case "month": return daysDiff <= 30;
                default: return true;
            }
        })();

        return matchesSearch && matchesStatus && matchesDate;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Custom Designs</h1>
                    <p className="text-gray-600">View and manage customer-created designs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by customer name, email, or product..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="saved">Saved</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-40">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Designs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Designs ({filteredDesigns.length})</CardTitle>
                    <CardDescription>Customer-created product designs</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Preview</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Elements</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDesigns.map((design) => (
                                <TableRow key={design.id}>
                                    <TableCell>
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                            {design.previewUrl ? (
                                                <img
                                                    src={design.previewUrl}
                                                    alt="Design preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No preview
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{design.user.name}</div>
                                            <div className="text-sm text-gray-500">{design.user.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{design.product.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {design.designData.elements.map((element, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {element.type}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(design.status)}>
                                            {design.status}
                                        </Badge>
                                        {design.orderItem && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Order #{design.orderItem.orderId}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div>{new Date(design.createdAt).toLocaleDateString()}</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(design.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedDesign(design)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Design Details</DialogTitle>
                                                        <DialogDescription>
                                                            View design created by {design.user.name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    {selectedDesign && (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="font-semibold mb-2">Customer Info</h4>
                                                                    <p><strong>Name:</strong> {selectedDesign.user.name}</p>
                                                                    <p><strong>Email:</strong> {selectedDesign.user.email}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold mb-2">Product Info</h4>
                                                                    <p><strong>Product:</strong> {selectedDesign.product.name}</p>
                                                                    <p><strong>Status:</strong> {selectedDesign.status}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Design Elements</h4>
                                                                <div className="space-y-2">
                                                                    {selectedDesign.designData.elements.map((element, index) => (
                                                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Badge variant="outline">{element.type}</Badge>
                                                                            </div>
                                                                            <pre className="text-sm text-gray-600 overflow-x-auto">
                                                                                {JSON.stringify(element.data, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {selectedDesign.previewUrl && (
                                                                <div>
                                                                    <h4 className="font-semibold mb-2">Preview</h4>
                                                                    <div className="border rounded-lg overflow-hidden">
                                                                        <img
                                                                            src={selectedDesign.previewUrl}
                                                                            alt="Design preview"
                                                                            className="w-full max-w-md mx-auto"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadDesign(design)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteDesign(design.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredDesigns.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No designs found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
