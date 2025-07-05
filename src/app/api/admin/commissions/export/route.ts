import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { subDays } from "date-fns";
import { convertPrice, isSupportedCurrency, formatPrice } from "@/lib/currency-utils";

// GET admin commission data export
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has admin role
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");
        const currencyParam = searchParams.get('currency') || 'USD';
        const currency = isSupportedCurrency(currencyParam) ? currencyParam : 'USD';

        const startDate = subDays(new Date(), days);

        // Get commission data for export
        const commissions = await db.vendorCommission.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            include: {
                vendor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Convert to CSV format
        const csvHeaders = [
            'Date',
            'Order Number',
            'Vendor Name',
            'Vendor Email',
            'Product Name',
            'Sale Amount',
            'Commission Rate',
            'Vendor Earnings',
            'Transaction Fee',
            'Performance Bonus',
            'Platform Earnings',
            'Status',
            'Currency'
        ];

        const csvRows = await Promise.all(
            commissions.map(async (commission) => {
                const transactionFee = typeof commission.transactionFee === 'object' ? Number(commission.transactionFee) : (commission.transactionFee || 0);
                const performanceBonus = typeof commission.performanceBonus === 'object' ? Number(commission.performanceBonus) : (commission.performanceBonus || 0);
                const platformEarnings = (commission.saleAmount * commission.commissionRate) + transactionFee - performanceBonus;

                const [
                    convertedSaleAmount,
                    convertedVendorEarnings,
                    convertedTransactionFee,
                    convertedPerformanceBonus,
                    convertedPlatformEarnings
                ] = await Promise.all([
                    convertPrice(commission.saleAmount, currency),
                    convertPrice(commission.commissionAmount, currency),
                    convertPrice(transactionFee, currency),
                    convertPrice(performanceBonus, currency),
                    convertPrice(platformEarnings, currency)
                ]);

                return [
                    new Date(commission.createdAt).toISOString().split('T')[0],
                    commission.order.orderNumber,
                    commission.vendor.name,
                    commission.vendor.email,
                    commission.product.name,
                    convertedSaleAmount.toFixed(2),
                    (commission.commissionRate * 100).toFixed(2) + '%',
                    convertedVendorEarnings.toFixed(2),
                    convertedTransactionFee.toFixed(2),
                    convertedPerformanceBonus.toFixed(2),
                    convertedPlatformEarnings.toFixed(2),
                    commission.status,
                    currency
                ];
            })
        );

        // Create CSV content
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="admin-commission-report-${days}days-${currency}.csv"`
            }
        });

    } catch (error) {
        console.error("Error exporting admin commission data:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to export commission data",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
