import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET vendor profile
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;

        // Get vendor profile
        const vendor = await db.user.findUnique({
            where: { id: vendorId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                // Extended vendor fields would be here if we had them
                // For now we'll use user fields and extend as needed
            }
        });

        if (!vendor) {
            return NextResponse.json(
                { error: "Vendor not found" },
                { status: 404 }
            );
        }

        // Get vendor statistics
        const [products, orders] = await Promise.all([
            db.product.count({
                where: { vendorId: vendorId }
            }),
            db.order.findMany({
                where: {
                    items: {
                        some: {
                            product: {
                                vendorId: vendorId
                            }
                        }
                    }
                },
                include: {
                    items: {
                        where: {
                            product: {
                                vendorId: vendorId
                            }
                        }
                    }
                }
            })
        ]);

        const totalRevenue = orders.reduce((sum, order) => {
            const vendorItemsTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            return sum + vendorItemsTotal;
        }, 0);

        const profile = {
            ...vendor,
            totalProducts: products,
            totalOrders: orders.length,
            totalRevenue,
            // These would come from extended vendor profile fields
            businessName: "",
            businessDescription: "",
            businessAddress: "",
            businessPhone: "",
            businessWebsite: "",
            taxId: "",
        };

        return NextResponse.json({ profile });

    } catch (error) {
        console.error("Error fetching vendor profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// PUT update vendor profile
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has vendor role
        if (!session?.user || session.user.role !== "VENDOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendorId = session.user.id;
        const data = await request.json();

        // Update user basic fields
        const updatedUser = await db.user.update({
            where: { id: vendorId },
            data: {
                name: data.name,
                email: data.email,
            }
        });

        // For now, we'll store extended vendor fields in a simple way
        // In a production app, you might create a separate VendorProfile table

        // Get updated profile with statistics
        const [products, orders] = await Promise.all([
            db.product.count({
                where: { vendorId: vendorId }
            }),
            db.order.findMany({
                where: {
                    items: {
                        some: {
                            product: {
                                vendorId: vendorId
                            }
                        }
                    }
                },
                include: {
                    items: {
                        where: {
                            product: {
                                vendorId: vendorId
                            }
                        }
                    }
                }
            })
        ]);

        const totalRevenue = orders.reduce((sum, order) => {
            const vendorItemsTotal = order.items.reduce((itemSum, item) => itemSum + item.total, 0);
            return sum + vendorItemsTotal;
        }, 0);

        const profile = {
            ...updatedUser,
            totalProducts: products,
            totalOrders: orders.length,
            totalRevenue,
            businessName: data.businessName || "",
            businessDescription: data.businessDescription || "",
            businessAddress: data.businessAddress || "",
            businessPhone: data.businessPhone || "",
            businessWebsite: data.businessWebsite || "",
            taxId: data.taxId || "",
        };

        return NextResponse.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error("Error updating vendor profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
