import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get dropshipping statistics
        const [
            totalSuppliers,
            activeSuppliers,
            totalImportedProducts,
            pendingOrders
        ] = await Promise.all([
            db.supplier.count(),
            db.supplier.count({
                where: {
                    status: 'ACTIVE'
                }
            }),
            db.product.count({
                where: {
                    supplierId: {
                        not: null
                    }
                }
            }),
            db.supplierOrder.count({
                where: {
                    status: 'PENDING'
                }
            })
        ]);

        // Get recent supplier orders
        const recentOrders = await db.supplierOrder.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                supplier: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            }
        });

        // Get supplier performance stats
        const supplierStats = await db.supplier.findMany({
            include: {
                _count: {
                    select: {
                        products: true,
                        supplierOrders: true
                    }
                }
            }
        });

        return NextResponse.json({
            stats: {
                totalSuppliers,
                activeSuppliers,
                totalImportedProducts,
                pendingOrders
            },
            recentOrders,
            supplierStats
        });

    } catch (error) {
        console.error("Error fetching dropshipping dashboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch dropshipping dashboard data" },
            { status: 500 }
        );
    }
}
