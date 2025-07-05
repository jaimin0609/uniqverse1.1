// Debug commission calculation
import { db } from './src/lib/db.js';
import { EnhancedVendorCommissionService } from './src/lib/enhanced-vendor-commission-service.js';

async function debugCommissions() {
    try {
        console.log('🔍 Debugging Commission System...\n');

        // Find recent orders with vendor products
        const recentOrders = await db.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            vendor: {
                                role: 'VENDOR'
                            }
                        }
                    }
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                vendor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log(`Found ${recentOrders.length} recent orders with vendor products\n`);

        for (const order of recentOrders) {
            console.log(`\n📦 Order ${order.orderNumber} (${order.id})`);
            console.log(`   Total: $${order.total.toFixed(2)}`);
            console.log(`   Status: ${order.status}`);

            for (const item of order.items) {
                if (item.product.vendor) {
                    console.log(`\n   📋 Item: ${item.product.name}`);
                    console.log(`      Sale Amount: $${item.total.toFixed(2)}`);
                    console.log(`      Vendor: ${item.product.vendor.name}`);

                    // Calculate what commission SHOULD be
                    try {
                        const commissionCalc = await EnhancedVendorCommissionService.calculateEnhancedCommission(
                            item.product.vendor.id,
                            item.total,
                            order.id
                        );

                        console.log(`      📊 Commission Calculation:`);
                        console.log(`         Base Commission: $${commissionCalc.baseCommission.toFixed(2)}`);
                        console.log(`         Transaction Fee: $${commissionCalc.transactionFee.toFixed(2)}`);
                        console.log(`         Total Fees: $${commissionCalc.totalFees.toFixed(2)}`);
                        console.log(`         Vendor Earnings: $${commissionCalc.vendorEarnings.toFixed(2)}`);
                        console.log(`         Platform Earnings: $${commissionCalc.platformEarnings.toFixed(2)}`);

                        // Check what's actually stored in DB
                        const storedCommission = await db.vendorCommission.findFirst({
                            where: {
                                orderId: order.id,
                                orderItemId: item.id,
                                vendorId: item.product.vendor.id
                            }
                        });

                        if (storedCommission) {
                            console.log(`      💾 Stored in DB:`);
                            console.log(`         Commission Amount: $${storedCommission.commissionAmount.toFixed(2)}`);
                            console.log(`         Sale Amount: $${storedCommission.saleAmount.toFixed(2)}`);
                            console.log(`         Status: ${storedCommission.status}`);
                        } else {
                            console.log(`      ❌ No commission record found in DB!`);
                        }

                    } catch (error) {
                        console.log(`      ❌ Error calculating commission: ${error.message}`);
                    }
                }
            }
        }

        // Check total vendor earnings
        const vendorCommissions = await db.vendorCommission.groupBy({
            by: ['vendorId'],
            _sum: {
                commissionAmount: true,
                saleAmount: true
            },
            _count: {
                id: true
            }
        });

        console.log(`\n📈 Vendor Commission Summary:`);
        for (const vendorSummary of vendorCommissions) {
            const vendor = await db.user.findUnique({
                where: { id: vendorSummary.vendorId },
                select: { name: true }
            });

            console.log(`\n   👤 ${vendor?.name || 'Unknown Vendor'}`);
            console.log(`      Total Sales: $${(vendorSummary._sum.saleAmount || 0).toFixed(2)}`);
            console.log(`      Total Earnings: $${(vendorSummary._sum.commissionAmount || 0).toFixed(2)}`);
            console.log(`      Number of Sales: ${vendorSummary._count.id}`);
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        await db.$disconnect();
    }
}

debugCommissions();
