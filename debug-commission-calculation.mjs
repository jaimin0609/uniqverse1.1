import { db } from "@/lib/db";
import { EnhancedVendorCommissionService } from "@/lib/enhanced-vendor-commission-service";

async function debugCommissionCalculation() {
    console.log("=== DEBUG COMMISSION CALCULATION ===");
    
    // Find a recent order with vendor items
    const recentOrder = await db.order.findFirst({
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
                            vendor: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!recentOrder) {
        console.log("No orders found with vendor items");
        return;
    }

    console.log(`\nOrder: ${recentOrder.orderNumber}`);
    console.log(`Order Total: $${recentOrder.total}`);
    console.log(`Order Items: ${recentOrder.items.length}`);

    for (const item of recentOrder.items) {
        if (item.product.vendor?.role === 'VENDOR') {
            console.log(`\n--- Item: ${item.product.name} ---`);
            console.log(`Vendor: ${item.product.vendor.name}`);
            console.log(`Item Total: $${item.total}`);
            console.log(`Quantity: ${item.quantity}`);
            console.log(`Price: $${item.price}`);

            // Calculate commission using the service
            const commissionDetails = await EnhancedVendorCommissionService.calculateEnhancedCommission(
                item.product.vendorId,
                item.total,
                recentOrder.id
            );

            console.log(`\n--- Commission Calculation ---`);
            console.log(`Base Commission: $${commissionDetails.baseCommission.toFixed(2)}`);
            console.log(`Transaction Fee: $${commissionDetails.transactionFee.toFixed(2)}`);
            console.log(`Performance Bonus: $${commissionDetails.performanceBonus.toFixed(2)}`);
            console.log(`Total Fees: $${commissionDetails.totalFees.toFixed(2)}`);
            console.log(`Vendor Earnings: $${commissionDetails.vendorEarnings.toFixed(2)}`);
            console.log(`Platform Earnings: $${commissionDetails.platformEarnings.toFixed(2)}`);

            // Check if there's a commission record for this item
            const existingCommission = await db.vendorCommission.findFirst({
                where: {
                    orderItemId: item.id,
                    vendorId: item.product.vendorId
                }
            });

            if (existingCommission) {
                console.log(`\n--- Stored Commission Record ---`);
                console.log(`Commission Amount: $${existingCommission.commissionAmount.toFixed(2)}`);
                console.log(`Sale Amount: $${existingCommission.saleAmount.toFixed(2)}`);
                console.log(`Commission Rate: ${(existingCommission.commissionRate * 100).toFixed(2)}%`);
                console.log(`Transaction Fee: $${(existingCommission.transactionFee || 0).toFixed(2)}`);
                console.log(`Performance Bonus: $${(existingCommission.performanceBonus || 0).toFixed(2)}`);
                console.log(`Status: ${existingCommission.status}`);
                
                // Check if the stored amount matches the calculated amount
                if (Math.abs(existingCommission.commissionAmount - commissionDetails.vendorEarnings) > 0.01) {
                    console.log(`\n🚨 MISMATCH! Stored: $${existingCommission.commissionAmount.toFixed(2)}, Calculated: $${commissionDetails.vendorEarnings.toFixed(2)}`);
                } else {
                    console.log(`\n✅ Commission amounts match!`);
                }
            } else {
                console.log(`\n❌ No commission record found for this item`);
            }
        }
    }
}

debugCommissionCalculation().catch(console.error);
