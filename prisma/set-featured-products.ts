import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Starting to mark featured products...');

    // Get all products
    const products = await prisma.product.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
        console.log('❌ No products found in the database');
        return;
    }

    // Select 4-8 products to mark as featured
    const totalToMark = Math.min(8, Math.max(4, Math.floor(products.length * 0.15)));
    const selectedProducts = products.slice(0, totalToMark);

    console.log(`📊 Found ${products.length} total products. Marking ${totalToMark} as featured...`);

    // Mark selected products as featured with different feature order numbers
    for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        await prisma.product.update({
            where: { id: product.id },
            data: {
                isFeatured: true,
                featuredOrder: i + 1,
            },
        });
        console.log(`✅ Marked product "${product.name}" as featured with order ${i + 1}`);
    }

    console.log('🎉 Successfully marked featured products!');
}

main()
    .catch(e => {
        console.error('❌ Error marking featured products:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });