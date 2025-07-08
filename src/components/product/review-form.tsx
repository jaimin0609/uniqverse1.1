"use client";

import { useState } from "react";
import { Star, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ReviewFormProps {
    productId: string;
    productName: string;
    onSubmitted: (review: any) => void;
    onCancel: () => void;
}

export function ReviewForm({ productId, productName, onSubmitted, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        if (!content.trim()) {
            toast.error("Please write a review");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    rating,
                    title: title.trim() || undefined,
                    content: content.trim(),
                    images: images.length > 0 ? images.join(",") : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Review submitted successfully!");
                onSubmitted(data.review);
                // Reset form
                setRating(0);
                setTitle("");
                setContent("");
                setImages([]);
            } else {
                toast.error(data.error || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // For now, we'll just store placeholder URLs
        // In a real app, you'd upload to a service like Cloudinary or S3
        const newImages = Array.from(files).map((file, index) =>
            URL.createObjectURL(file) // This is just for preview - you'd need actual upload logic
        );

        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
        toast.info("Image upload feature coming soon! For now, images are just previewed.");
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
                <Label className="text-base font-medium">Overall Rating *</Label>
                <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="transition-colors"
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={`h-8 w-8 ${star <= (hoveredRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 hover:text-yellow-200"
                                    }`}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                        {rating > 0 && (
                            rating === 1 ? "Poor" :
                                rating === 2 ? "Fair" :
                                    rating === 3 ? "Good" :
                                        rating === 4 ? "Very Good" : "Excellent"
                        )}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div>
                <Label htmlFor="review-title">Review Title (Optional)</Label>
                <Input
                    id="review-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    maxLength={100}
                    className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Review Content */}
            <div>
                <Label htmlFor="review-content">Your Review *</Label>
                <Textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Tell others about your experience with ${productName}...`}
                    rows={5}
                    maxLength={1000}
                    className="mt-1"
                    required
                />
                <p className="text-xs text-gray-500 mt-1">{content.length}/1000 characters</p>
            </div>

            {/* Image Upload */}
            <div>
                <Label>Photos (Optional)</Label>
                <div className="mt-2">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Upload Photos</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={images.length >= 5}
                            />
                        </label>
                        <span className="text-xs text-gray-500">Max 5 photos</span>
                    </div>

                    {images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {images.map((image, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={image}
                                        alt={`Upload ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={loading || rating === 0 || !content.trim()}
                    className="flex-1"
                >
                    {loading ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>

            {/* Guidelines */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Review Guidelines:</p>
                <ul className="space-y-1">
                    <li>• Be honest and helpful in your review</li>
                    <li>• Focus on the product's features and your experience</li>
                    <li>• Reviews are moderated and may take 24-48 hours to appear</li>
                    <li>• Avoid offensive language or personal information</li>
                </ul>
            </div>
        </form>
    );
}
