// Quick script to get product URLs for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: {
            name: true,
            slug: true,
            variants: {
                select: {
                    name: true,
                    image: true
                }
            }
        },
        take: 5
    });
    
    console.log('Test URLs:');
    products.forEach(p => {
        const hasVariantImage = p.variants.some(v => v.image);
        console.log(`${p.name}: http://localhost:3000/products/${p.slug} ${hasVariantImage ? '(has variant images)' : ''}`);
    });
    
    await prisma.$disconnect();
}

main();
