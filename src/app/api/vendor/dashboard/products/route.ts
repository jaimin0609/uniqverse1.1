import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { convertPrice, isSupportedCurrency } from "@/lib/currency-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        // Get top performing products with aggregated data
        const topProducts = await db.product.findMany({
            where: {
                vendorId: vendorId,
                isPublished: true
            },
            select: {
                id: true,
                name: true,
                price: true,
                inventory: true,
                _count: {
                    select: {
                        orderItems: true
                    }
                },
                orderItems: {
                    select: {
                        total: true
                    }
                }
            },
            orderBy: {
                orderItems: {
                    _count: 'desc'
                }
            },
            take: 5
        });

        // Calculate revenue for each product and convert currency
        const productsWithRevenue = await Promise.all(
            topProducts.map(async (product) => {
                const revenue = product.orderItems.reduce((sum, item) => sum + item.total, 0);
                return {
                    id: product.id,
                    name: product.name,
                    price: await convertPrice(product.price, currency),
                    inventory: product.inventory,
                    orders: product._count.orderItems,
                    revenue: await convertPrice(revenue, currency),
                    status: product.inventory > 0 ? 'In Stock' : 'Out of Stock'
                };
            })
        );

        return NextResponse.json({
            topProducts: productsWithRevenue,
            currency
        });

    } catch (error) {
        console.error("Error fetching top products:", error);
        return NextResponse.json(
            { error: "Failed to fetch top products" },
            { status: 500 }
        );
    }
}
