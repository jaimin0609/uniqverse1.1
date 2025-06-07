import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCustomizableProducts() {
    try {
        console.log('🎨 Adding customizable products...');

        // First, let's check if we have any categories
        const categories = await prisma.category.findMany();
        console.log(`Found ${categories.length} categories`);

        // Create or find a clothing category
        let clothingCategory = await prisma.category.findFirst({
            where: { name: { contains: 'Clothing', mode: 'insensitive' } }
        });

        if (!clothingCategory) {
            clothingCategory = await prisma.category.create({
                data: {
                    name: 'Custom Clothing',
                    slug: 'custom-clothing',
                    description: 'Customizable clothing items'
                }
            });
            console.log('✅ Created Custom Clothing category');
        }

        // Add customizable t-shirt
        const customTshirt = await prisma.product.upsert({
            where: { slug: 'custom-t-shirt' },
            update: {
                isCustomizable: true,
                customizationTemplate: JSON.stringify({
                    canvas: { width: 300, height: 300 },
                    printAreas: [{
                        name: 'Front',
                        x: 50,
                        y: 50,
                        width: 200,
                        height: 250
                    }],
                    allowedElements: ['text', 'image', 'shape']
                }),
                printArea: JSON.stringify({
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 250
                })
            },
            create: {
                name: 'Custom T-Shirt',
                slug: 'custom-t-shirt',
                description: 'Design your own custom t-shirt with text, images, and shapes',
                price: 25.99,
                compareAtPrice: 35.99,
                inventory: 100,
                sku: 'CUSTOM-TSHIRT-001',
                categoryId: clothingCategory.id,
                isPublished: true,
                isFeatured: true,
                featuredOrder: 1,
                isCustomizable: true,
                customizationTemplate: JSON.stringify({
                    canvas: { width: 300, height: 300 },
                    printAreas: [{
                        name: 'Front',
                        x: 50,
                        y: 50,
                        width: 200,
                        height: 250
                    }],
                    allowedElements: ['text', 'image', 'shape']
                }),
                printArea: JSON.stringify({
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 250
                })
            }
        });

        // Add customizable hoodie
        const customHoodie = await prisma.product.upsert({
            where: { slug: 'custom-hoodie' },
            update: {
                isCustomizable: true,
                customizationTemplate: JSON.stringify({
                    canvas: { width: 350, height: 400 },
                    printAreas: [{
                        name: 'Front',
                        x: 75,
                        y: 100,
                        width: 200,
                        height: 200
                    }],
                    allowedElements: ['text', 'image', 'shape']
                }),
                printArea: JSON.stringify({
                    x: 75,
                    y: 100,
                    width: 200,
                    height: 200
                })
            },
            create: {
                name: 'Custom Hoodie',
                slug: 'custom-hoodie',
                description: 'Create your personalized hoodie with custom designs',
                price: 45.99,
                compareAtPrice: 65.99,
                inventory: 50,
                sku: 'CUSTOM-HOODIE-001',
                categoryId: clothingCategory.id,
                isPublished: true,
                isFeatured: true,
                featuredOrder: 2,
                isCustomizable: true,
                customizationTemplate: JSON.stringify({
                    canvas: { width: 350, height: 400 },
                    printAreas: [{
                        name: 'Front',
                        x: 75,
                        y: 100,
                        width: 200,
                        height: 200
                    }],
                    allowedElements: ['text', 'image', 'shape']
                }),
                printArea: JSON.stringify({
                    x: 75,
                    y: 100,
                    width: 200,
                    height: 200
                })
            }
        });

        // Add some product images
        await prisma.productImage.createMany({
            data: [
                {
                    productId: customTshirt.id,
                    url: '/placeholder-product.jpg',
                    alt: 'Custom T-Shirt',
                    position: 1
                },
                {
                    productId: customHoodie.id,
                    url: '/placeholder-product.jpg',
                    alt: 'Custom Hoodie',
                    position: 1
                }
            ],
            skipDuplicates: true
        });

        // Add some variants
        await prisma.productVariant.createMany({
            data: [
                // T-shirt variants
                {
                    productId: customTshirt.id,
                    name: 'Small - White',
                    price: 25.99,
                    options: 'Size: Small, Color: White',
                    type: 'size-color'
                },
                {
                    productId: customTshirt.id,
                    name: 'Medium - White',
                    price: 25.99,
                    options: 'Size: Medium, Color: White',
                    type: 'size-color'
                },
                {
                    productId: customTshirt.id,
                    name: 'Large - White',
                    price: 25.99,
                    options: 'Size: Large, Color: White',
                    type: 'size-color'
                },
                // Hoodie variants
                {
                    productId: customHoodie.id,
                    name: 'Small - Black',
                    price: 45.99,
                    options: 'Size: Small, Color: Black',
                    type: 'size-color'
                },
                {
                    productId: customHoodie.id,
                    name: 'Medium - Black',
                    price: 45.99,
                    options: 'Size: Medium, Color: Black',
                    type: 'size-color'
                },
                {
                    productId: customHoodie.id,
                    name: 'Large - Black',
                    price: 45.99,
                    options: 'Size: Large, Color: Black',
                    type: 'size-color'
                }
            ],
            skipDuplicates: true
        });

        console.log('✅ Successfully added customizable products:');
        console.log(`   - Custom T-Shirt (ID: ${customTshirt.id})`);
        console.log(`   - Custom Hoodie (ID: ${customHoodie.id})`);
        console.log('🎨 Customization setup complete!');

        // Check how many customizable products we now have
        const customizableCount = await prisma.product.count({
            where: { isCustomizable: true }
        });
        console.log(`📊 Total customizable products in database: ${customizableCount}`);

    } catch (error) {
        console.error('❌ Error adding customizable products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addCustomizableProducts();
