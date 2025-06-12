import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { subDays, format } from "date-fns";

// GET export vendor analytics data as CSV
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");

        const startDate = subDays(new Date(), days);

        // Get orders for the period
        const orders = await db.order.findMany({
            where: {
                createdAt: { gte: startDate },
                items: {
                    some: {
                        product: { vendorId: vendorId }
                    }
                }
            },
            include: {
                items: {
                    where: {
                        product: { vendorId: vendorId }
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Create CSV content
        const csvHeaders = [
            "Order Date",
            "Order Number",
            "Customer Name",
            "Customer Email",
            "Product Name",
            "Product SKU",
            "Quantity",
            "Unit Price",
            "Total",
            "Order Status",
            "Payment Status"
        ];

        const csvRows = [csvHeaders.join(",")];

        orders.forEach(order => {
            order.items.forEach(item => {
                const row = [
                    format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
                    order.orderNumber,
                    `"${order.user.name || ''}"`,
                    order.user.email,
                    `"${item.product.name}"`,
                    item.product.sku || '',
                    item.quantity,
                    item.price.toFixed(2),
                    item.total.toFixed(2),
                    order.status,
                    order.paymentStatus
                ];
                csvRows.push(row.join(","));
            });
        });

        const csvContent = csvRows.join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="vendor-analytics-${days}days.csv"`,
            },
        });

    } catch (error) {
        console.error("Error exporting vendor analytics:", error);
        return NextResponse.json(
            { error: "Failed to export analytics" },
            { status: 500 }
        );
    }
}
