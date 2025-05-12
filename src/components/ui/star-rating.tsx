import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
    rating: number;  // Rating out of 5
    reviewCount?: number;
    className?: string;
    showCount?: boolean;
}

export function StarRating({ rating, reviewCount, className = '', showCount = true }: StarRatingProps) {
    // Calculate full and half stars
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <div className={`flex items-center ${className}`}>
            <div className="flex text-yellow-400">
                {/* Full stars */}
                {Array.from({ length: fullStars }).map((_, i) => (
                    <Star key={`full-${i}`} size={16} fill="currentColor" />
                ))}

                {/* Half star if needed */}
                {hasHalfStar && (
                    <StarHalf size={16} fill="currentColor" />
                )}

                {/* Empty stars */}
                {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
                    <Star key={`empty-${i}`} size={16} className="text-gray-300" />
                ))}
            </div>

            {/* Review count */}
            {showCount && reviewCount !== undefined && reviewCount > 0 && (
                <span className="ml-1 text-xs text-gray-600">
                    ({reviewCount})
                </span>
            )}
        </div>
    );
}
