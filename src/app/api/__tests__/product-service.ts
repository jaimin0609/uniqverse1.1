// Product service module for testing
import { db } from '@/lib/db';

export type ProductsQueryParams = {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    search?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestselling';
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
};

export async function getProducts(params: ProductsQueryParams = {}) {
    try {
        const {
            page = 1,
            pageSize = 12,
            categoryId,
            search,
            sort = 'newest',
            minPrice,
            maxPrice,
            featured,
        } = params;

        const skip = (page - 1) * pageSize;

        // Build filter conditions
        const where: any = {
            isDeleted: false,
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        if (featured !== undefined) {
            where.isFeatured = featured;
        }

        // Build sort order
        let orderBy: any;
        switch (sort) {
            case 'price_asc':
                orderBy = { price: 'asc' };
                break;
            case 'price_desc':
                orderBy = { price: 'desc' };
                break;
            case 'bestselling':
                orderBy = { salesCount: 'desc' };
                break;
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        // Query products with pagination
        const products = await db.product.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                images: true,
                inventory: true,
                isFeatured: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
            },
        });

        // Count total matching products
        const totalCount = await db.product.count({ where });
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            success: true,
            products,
            pagination: {
                total: totalCount,
                page,
                pageSize,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            status: 200
        };
    } catch (error) {
        console.error('Get products error:', error);
        throw error;
    }
}

export async function getProductById(productId: string) {
    try {
        const product = await db.product.findUnique({
            where: {
                id: productId,
                isDeleted: false,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                variants: true,
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            return {
                success: false,
                message: 'Product not found',
                status: 404
            };
        }

        // Calculate average rating
        const averageRating = product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : null;

        return {
            success: true,
            product: {
                ...product,
                averageRating,
            },
            status: 200
        };
    } catch (error) {
        console.error('Get product by ID error:', error);
        throw error;
    }
}
