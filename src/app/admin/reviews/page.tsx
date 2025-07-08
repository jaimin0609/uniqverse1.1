"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, Eye, Check, X, Trash2, Filter, Search } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface Review {
    id: string;
    rating: number;
    title?: string;
    content?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    updatedAt: string;
    adminResponse?: string;
    user: {
        id: string;
        name: string;
        image?: string;
        email: string;
    };
    product: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function AdminReviewsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [adminResponse, setAdminResponse] = useState("");

    // Redirect if not admin
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "ADMIN") {
            router.push("/");
            return;
        }

        fetchReviews();
    }, [session, status, router]);

    const fetchReviews = async () => {
        try {
            const response = await fetch("/api/admin/reviews");
            const data = await response.json();

            if (data.success) {
                setReviews(data.reviews);
            } else {
                toast.error("Failed to fetch reviews");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    const updateReviewStatus = async (reviewId: string, status: string, response?: string) => {
        setActionLoading(reviewId);
        try {
            const res = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    adminResponse: response || undefined
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update review");
            }

            const data = await res.json();

            // Update the reviews list with the new data
            setReviews(prev =>
                prev.map(review =>
                    review.id === reviewId
                        ? { ...review, status: status as any, adminResponse: response || review.adminResponse }
                        : review
                )
            );
            toast.success(`Review ${status.toLowerCase()} successfully`);
            setSelectedReview(null);
            setAdminResponse("");
        } catch (error) {
            console.error("Error updating review:", error);
            toast.error("Failed to update review");
        } finally {
            setActionLoading(null);
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
            return;
        }

        setActionLoading(reviewId);
        try {
            const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                setReviews(prev => prev.filter(review => review.id !== reviewId));
                toast.success("Review deleted successfully");
            } else {
                toast.error(data.error || "Failed to delete review");
            }
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("Failed to delete review");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesStatus = selectedStatus === "all" || review.status === selectedStatus.toUpperCase();
        const matchesSearch = !searchTerm ||
            review.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.content && review.content.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary">Pending</Badge>;
            case "APPROVED":
                return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading reviews...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
                <p className="text-gray-600">Manage customer reviews and feedback</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search reviews, products, or users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Reviews</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reviews Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
                    <CardDescription>
                        Review and moderate customer feedback
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No reviews found matching your criteria.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Review</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={review.user.image || ""} />
                                                    <AvatarFallback>
                                                        {review.user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{review.user.name}</p>
                                                    <p className="text-xs text-gray-500">{review.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{review.product.name}</p>
                                                <p className="text-xs text-gray-500">{review.product.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {renderStars(review.rating)}
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            {review.title && (
                                                <p className="font-medium text-sm mb-1 line-clamp-1">
                                                    {review.title}
                                                </p>
                                            )}
                                            {review.content && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {review.content}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(review.status)}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">
                                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(review.createdAt), "h:mm a")}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedReview(review)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {review.status === "PENDING" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateReviewStatus(review.id, "APPROVED")}
                                                            disabled={actionLoading === review.id}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateReviewStatus(review.id, "REJECTED")}
                                                            disabled={actionLoading === review.id}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteReview(review.id)}
                                                    disabled={actionLoading === review.id}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Review Detail Modal */}
            {selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold">Review Details</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Customer</label>
                                    <p className="font-medium">{selectedReview.user.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Product</label>
                                    <p className="font-medium">{selectedReview.product.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Rating</label>
                                    <div>{renderStars(selectedReview.rating)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div>{getStatusBadge(selectedReview.status)}</div>
                                </div>
                            </div>

                            {selectedReview.title && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Title</label>
                                    <p className="font-medium">{selectedReview.title}</p>
                                </div>
                            )}

                            {selectedReview.content && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Review Content</label>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedReview.content}</p>
                                </div>
                            )}

                            {selectedReview.status === "PENDING" && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Admin Response (Optional)</label>
                                    <Textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder="Add a response to this review..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex gap-3">
                            {selectedReview.status === "PENDING" && (
                                <>
                                    <Button
                                        onClick={() => updateReviewStatus(selectedReview.id, "APPROVED", adminResponse)}
                                        disabled={actionLoading === selectedReview.id}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Approve Review
                                    </Button>
                                    <Button
                                        onClick={() => updateReviewStatus(selectedReview.id, "REJECTED", adminResponse)}
                                        disabled={actionLoading === selectedReview.id}
                                        variant="destructive"
                                    >
                                        Reject Review
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedReview(null);
                                    setAdminResponse("");
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
