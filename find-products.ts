// Simple query to find products with variants for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findTestProducts() {
    try {
        // Get first 10 products with their variants and images
        const products = await prisma.product.findMany({
            include: {
                images: true,
                variants: {
                    include: {
                        values: {
                            include: {
                                option: true
                            }
                        }
                    }
                }
            },
            take: 10
        });

        console.log(`Found ${products.length} products:\n`);

        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Slug: ${product.slug}`);
            console.log(`   URL: http://localhost:3000/products/${product.slug}`);
            console.log(`   Images: ${product.images.length}`);
            console.log(`   Variants: ${product.variants.length}`);

            if (product.variants.length > 0) {
                product.variants.forEach((variant, vIndex) => {
                    const variantOptions = variant.values.map(val => `${val.option.name}: ${val.value}`).join(', ');
                    console.log(`     Variant ${vIndex + 1}: ${variant.name} (${variantOptions}) - Image: ${variant.image ? '✅' : '❌'}`);
                });
            }
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findTestProducts();
