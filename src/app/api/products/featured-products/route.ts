import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const products = await db.product.findMany({
      skip,
      take: limit,
      where: {
        isFeatured: true,
        isPublished: true,
      },
      include: {
        images: {
          where: {
            position: 0
          },
          take: 1
        },
        category: true,
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Get total count for pagination info
    const totalCount = await db.product.count({
      where: {
        isFeatured: true,
        isPublished: true,
      },
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + products.length < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
