import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Using Response.json() for better performance
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("query");

        // Return empty results if no query
        if (!query || query.length < 2) {
            return Response.json({ suggestions: [] });
        }

        try {
            // Optimized query: focus on name matching first for better performance
            // Use startsWith for faster matching if possible
            let products = await db.product.findMany({
                where: {
                    isPublished: true,
                    name: { startsWith: query, mode: "insensitive" }
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: {
                        take: 1,
                        select: { url: true }
                    },
                    category: {
                        select: {
                            name: true
                        }
                    }
                },
                take: 5,
                orderBy: { name: "asc" }
            });

            // If we don't have enough results with startsWith, try contains
            if (products.length < 3) {
                const additionalProducts = await db.product.findMany({
                    where: {
                        isPublished: true,
                        name: { contains: query, mode: "insensitive" },
                        // Exclude products we already have
                        id: { notIn: products.map(p => p.id) }
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        images: {
                            take: 1,
                            select: { url: true }
                        },
                        category: {
                            select: {
                                name: true
                            }
                        }
                    },
                    take: 5 - products.length,
                });

                products = [...products, ...additionalProducts];
            }            // Minimal processing for faster response
            const suggestions = products.map(product => ({
                id: product.id,
                name: product.name || "Unnamed Product",
                slug: product.slug || `product-${product.id}`,
                price: product.price || 0,
                image: product.images?.[0]?.url || null,
                category: product.category?.name || "Uncategorized"
            }));

            // Return with caching headers for 5 minutes
            // This helps with repeated searches but still refreshes data periodically
            return new Response(
                JSON.stringify({ suggestions }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=300',
                    }
                }
            );

        } catch (dbError) {
            console.error("Database error:", dbError);
            return Response.json(
                { error: "Database error", suggestions: [] },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in product search suggestions:", error);
        return Response.json(
            { error: "Failed to fetch product suggestions", suggestions: [] },
            { status: 500 }
        );
    }
}
