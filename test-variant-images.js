// Test script to check variant image functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVariantImages() {
    try {
        console.log('🔍 Searching for products with variants that have images...\n');
        
        // Find products with variants that have images
        const productsWithVariantImages = await prisma.product.findMany({
            where: {
                variants: {
                    some: {
                        image: {
                            not: null
                        }
                    }
                }
            },
            include: {
                images: true,
                variants: {
                    where: {
                        image: {
                            not: null
                        }
                    }
                }
            },
            take: 5 // Get first 5 products
        });

        if (productsWithVariantImages.length === 0) {
            console.log('❌ No products found with variant images');
            
            // Show some example products with variants
            const productsWithVariants = await prisma.product.findMany({
                include: {
                    variants: true,
                    images: true
                },
                take: 5
            });
            
            console.log('\n📦 Example products with variants:');
            productsWithVariants.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name}`);
                console.log(`   Slug: ${product.slug}`);
                console.log(`   Variants: ${product.variants.length}`);
                console.log(`   Product Images: ${product.images.length}`);
                console.log(`   Variant Images: ${product.variants.filter(v => v.image).length}`);
                console.log(`   URL: http://localhost:3000/products/${product.slug}\n`);
            });
            
            return;
        }

        console.log(`✅ Found ${productsWithVariantImages.length} products with variant images!\n`);

        productsWithVariantImages.forEach((product, index) => {
            console.log(`${index + 1}. 📦 ${product.name}`);
            console.log(`   Slug: ${product.slug}`);
            console.log(`   Product Images: ${product.images.length}`);
            console.log(`   Variants with Images: ${product.variants.length}`);
            console.log(`   🌐 Test URL: http://localhost:3000/products/${product.slug}`);
            console.log(`   📸 Product Images:`);
            product.images.forEach((img, i) => {
                console.log(`      ${i + 1}. ${img.url}`);
            });
            console.log(`   🎨 Variant Images:`);
            product.variants.forEach((variant, i) => {
                console.log(`      ${i + 1}. ${variant.name}: ${variant.image}`);
            });
            console.log('');
        });

        console.log('🧪 Testing Instructions:');
        console.log('1. Open any of the URLs above in your browser');
        console.log('2. Select different variants on the product page');
        console.log('3. Watch the main product image change to the variant image');
        console.log('4. The image gallery should show both product and variant images');
        console.log('5. You can navigate between images using the gallery thumbnails or arrow buttons\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testVariantImages();
