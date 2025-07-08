"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewForm } from "./review-form";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Review {
    id: string;
    rating: number;
    title?: string | null;
    content?: string | null;
    images?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    helpfulVotes: number;
    isVerified: boolean;
    user: {
        id: string;
        name: string | null;
        image?: string | null;
    };
}

interface ReviewsProps {
    productId: string;
    productName: string;
    initialReviews?: Review[];
    averageRating?: number;
    totalReviews?: number;
}

export function ProductReviews({
    productId,
    productName,
    initialReviews = [],
    averageRating = 0,
    totalReviews = 0
}: ReviewsProps) {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialReviews.length >= 10);
    const [canReview, setCanReview] = useState<{
        eligible: boolean;
        reason: string;
        message: string;
        existingReview?: any;
    } | null>(null);

    // Check if user can review this product
    useEffect(() => {
        if (session?.user) {
            checkReviewEligibility();
        }
    }, [session, productId]);

    const checkReviewEligibility = async () => {
        try {
            const response = await fetch(`/api/reviews/can-review?productId=${productId}`);
            const data = await response.json();
            setCanReview({
                eligible: data.canReview,
                reason: data.reason,
                message: data.message,
                existingReview: data.existingReview
            });
        } catch (error) {
            console.error("Error checking review eligibility:", error);
        }
    };

    // Load more reviews
    const loadMoreReviews = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await fetch(
                `/api/reviews?productId=${productId}&page=${page + 1}&limit=10`
            );
            const data = await response.json();

            if (data.success) {
                setReviews(prev => [...prev, ...data.reviews]);
                setPage(prev => prev + 1);
                setHasMore(data.reviews.length >= 10);
            }
        } catch (error) {
            console.error("Error loading more reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle new review submission
    const handleReviewSubmitted = (newReview: Review) => {
        setReviews(prev => [newReview, ...prev]);
        setShowReviewForm(false);
    };

    // Render star rating
    const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
        const sizeClass = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";

        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizeClass} ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    // Get rating distribution
    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            distribution[review.rating as keyof typeof distribution]++;
        });
        return distribution;
    };

    const ratingDistribution = getRatingDistribution();

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {renderStars(Math.round(averageRating), "lg")}
                            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                            <span className="text-gray-600">({totalReviews} reviews)</span>
                        </div>
                    </div>
                </div>

                {session ? (
                    <div className="flex flex-col items-end gap-2">
                        {canReview?.eligible ? (
                            <Button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="flex items-center gap-2"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Write a Review
                            </Button>
                        ) : canReview?.reason === "ALREADY_REVIEWED" ? (
                            <div className="text-center">
                                <Badge variant="secondary" className="mb-2">
                                    You've already reviewed this product
                                </Badge>
                                <div className="text-sm text-gray-600">
                                    Review status: {canReview.existingReview?.status}
                                </div>
                            </div>
                        ) : canReview?.reason === "NOT_PURCHASED" ? (
                            <div className="text-center">
                                <Button variant="outline" disabled className="mb-2">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Write a Review
                                </Button>
                                <div className="text-sm text-gray-600 max-w-48">
                                    Only customers who have purchased and received this product can write reviews
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="flex items-center gap-2"
                                disabled={canReview === null}
                            >
                                <MessageCircle className="h-4 w-4" />
                                {canReview === null ? "Checking..." : "Write a Review"}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <Button variant="outline" disabled className="mb-2">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Write a Review
                        </Button>
                        <div className="text-sm text-gray-600">
                            Please log in to write a review
                        </div>
                    </div>
                )}
            </div>

            {/* Rating Distribution */}
            {reviews.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Rating Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <span className="text-sm font-medium w-8">{rating}</span>
                                        {renderStars(rating, "sm")}
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 w-12">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Write Your Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReviewForm
                            productId={productId}
                            productName={productName}
                            onSubmitted={handleReviewSubmitted}
                            onCancel={() => setShowReviewForm(false)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                            <p className="text-gray-600 mb-4">Be the first to review this product!</p>
                            {session && (
                                <Button onClick={() => setShowReviewForm(true)}>
                                    Write the First Review
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.user.image || ""} />
                                        <AvatarFallback>
                                            {review.user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium">{review.user.name || "Anonymous"}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {renderStars(review.rating)}
                                                    {review.isVerified && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Verified Purchase
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                                            </span>
                                        </div>

                                        {review.title && (
                                            <h5 className="font-medium mb-2">{review.title}</h5>
                                        )}

                                        {review.content && (
                                            <p className="text-gray-700 mb-3">{review.content}</p>
                                        )}

                                        {review.images && (
                                            <div className="flex gap-2 mb-3">
                                                {review.images.split(",").map((imageUrl, index) => (
                                                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={imageUrl.trim()}
                                                            alt={`Review image ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <button className="flex items-center gap-1 hover:text-gray-900">
                                                <ThumbsUp className="h-4 w-4" />
                                                Helpful ({review.helpfulVotes})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {hasMore && reviews.length > 0 && (
                <div className="text-center mt-8">
                    <Button
                        variant="outline"
                        onClick={loadMoreReviews}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Load More Reviews"}
                    </Button>
                </div>
            )}
        </div>
    );
}
