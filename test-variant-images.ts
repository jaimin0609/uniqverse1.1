// Test script to check variant image functionality
import { PrismaClient } from '@prisma/client';

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
                product.variants.forEach((variant, vIndex) => {
                    console.log(`   Variant ${vIndex + 1}: ${variant.name} - Image: ${variant.image ? '✅' : '❌'}`);
                });
                console.log('');
            });
        } else {
            console.log(`✅ Found ${productsWithVariantImages.length} products with variant images!\n`);
            
            productsWithVariantImages.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name}`);
                console.log(`   🔗 URL: http://localhost:3000/products/${product.slug}`);
                console.log(`   📸 Product Images: ${product.images.length}`);
                console.log(`   🎨 Variants with Images: ${product.variants.length}`);
                
                product.variants.forEach((variant, vIndex) => {
                    console.log(`   Variant ${vIndex + 1}: ${variant.name}`);
                    console.log(`     Image: ${variant.image}`);
                });
                console.log('');
            });
        }
        
        console.log('\n🧪 Manual Testing Instructions:');
        console.log('1. Visit one of the product URLs above');
        console.log('2. Check that the main image gallery shows product images');
        console.log('3. Select different variants using the size/color selectors');
        console.log('4. Verify that the main image updates when variant with image is selected');
        console.log('5. Test navigation between images using thumbnails and arrow buttons');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testVariantImages();
