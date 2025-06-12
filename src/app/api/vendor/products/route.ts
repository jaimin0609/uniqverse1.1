import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const category = searchParams.get("category");

        const skip = (page - 1) * limit;
        const vendorId = session.user.id;

        // Build where clause
        const where: any = {
            vendorId: vendorId
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        } if (status && status !== "all") {
            // Map status values to the correct field
            if (status === "published") {
                where.isPublished = true;
            } else if (status === "draft") {
                where.isPublished = false;
            }
        }

        if (category && category !== "all") {
            where.categoryId = category;
        }

        // Get products with pagination
        const [products, total] = await Promise.all([
            db.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    images: {
                        take: 1,
                        select: {
                            url: true
                        }
                    }, _count: {
                        select: {
                            orderItems: true,
                            reviews: true
                        }
                    }
                }
            }),
            db.product.count({ where })
        ]);

        return NextResponse.json({
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("Error fetching vendor products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const vendorId = session.user.id;

        // Validate required fields
        if (!data.name || !data.price) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        // Generate unique slug
        const generateUniqueSlug = async (name: string) => {
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let slug = baseSlug;
            let counter = 1;

            while (true) {
                const existingProduct = await db.product.findUnique({
                    where: { slug },
                });

                if (!existingProduct) {
                    return slug;
                }

                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        };

        const uniqueSlug = await generateUniqueSlug(data.name);

        // Create product
        const product = await db.product.create({
            data: {
                name: data.name,
                slug: uniqueSlug,
                description: data.description || "",
                price: parseFloat(data.price),
                compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
                costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
                inventory: parseInt(data.inventory) || 0,
                sku: data.sku || `SKU-${vendorId}-${Date.now()}`,
                barcode: data.barcode || null,
                weight: data.weight ? parseFloat(data.weight) : null,
                dimensions: data.dimensions || null,
                brand: data.brand || null,
                tags: data.tags || null,
                isPublished: data.isPublished || false,
                lowStockThreshold: parseInt(data.lowStockThreshold) || 10,
                categoryId: data.categoryId,
                vendorId: vendorId,
            },
        });        // Create images if provided
        if (data.images && data.images.length > 0) {
            const now = new Date();
            await db.productImage.createMany({
                data: data.images.map((imageUrl: string, index: number) => ({
                    url: imageUrl,
                    alt: data.name,
                    position: index,
                    productId: product.id,
                    createdAt: now,
                    updatedAt: now,
                })),
            });
        }

        // Fetch the complete product with relations
        const completeProduct = await db.product.findUnique({
            where: { id: product.id },
            include: {
                images: true,
                variants: true,
                category: true
            }
        }); return NextResponse.json({
            success: true,
            product: completeProduct
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
