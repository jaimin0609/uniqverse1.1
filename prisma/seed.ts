import { PrismaClient } from '../src/generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed process...');

    // Clean up existing data
    await cleanDatabase();

    // Create categories
    const categories = await createCategories();
    console.log(`✅ Created ${categories.length} categories`);

    // Create products with variants and images
    const products = await createProducts(categories);
    console.log(`✅ Created ${products.length} products`);

    // Create users
    const users = await createUsers();
    console.log(`✅ Created ${users.length} users`);

    // Create reviews for products
    const reviews = await createReviews(products, users);
    console.log(`✅ Created ${reviews.length} reviews`);

    console.log('🎉 Seed process completed successfully!');
}

async function cleanDatabase() {
    console.log('🧹 Cleaning up existing data...');

    // Delete in order to respect foreign key constraints
    await prisma.review.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Database cleaned');
}

async function createCategories() {
    console.log('📁 Creating categories...');

    const categories = [
        { name: 'Electronics', slug: 'electronics', description: 'Latest electronic devices and gadgets' },
        { name: 'Clothing', slug: 'clothing', description: 'Fashion items for all occasions' },
        { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Everything you need for your home' },
        { name: 'Books', slug: 'books', description: 'Physical and digital books across all genres' },
        { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear and equipment for sports and outdoor activities' }
    ];

    const createdCategories = [];

    for (const category of categories) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name,
                slug: category.slug,
                description: category.description
            }
        });
        createdCategories.push(createdCategory);
    }

    return createdCategories;
}

async function createProducts(categories: any[]) {
    console.log('📦 Creating products...');

    const products = [];

    // Create 5-10 products for each category
    for (const category of categories) {
        const numProducts = faker.number.int({ min: 5, max: 10 });

        for (let i = 0; i < numProducts; i++) {
            const name = faker.commerce.productName();
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

            // Decide if product has a sale price
            const hasDiscount = faker.datatype.boolean(0.3); // 30% chance
            const basePrice = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
            const compareAtPrice = hasDiscount ? basePrice * (1 + faker.number.float({ min: 0.1, max: 0.5 })) : null;

            // Create product
            const product = await prisma.product.create({
                data: {
                    name,
                    slug: `${slug}-${faker.string.uuid().substring(0, 8)}`, // Ensure uniqueness
                    description: faker.commerce.productDescription(),
                    price: basePrice,
                    compareAtPrice,
                    inventory: faker.number.int({ min: 0, max: 100 }),
                    sku: faker.string.alphanumeric(10).toUpperCase(),
                    isPublished: true,
                    categoryId: category.id,
                }
            });

            // Create 1-4 variants
            const numVariants = faker.number.int({ min: 1, max: 4 });
            for (let v = 0; v < numVariants; v++) {
                await prisma.productVariant.create({
                    data: {
                        productId: product.id,
                        name: faker.commerce.productAdjective() + ' ' + name,
                        price: parseFloat(faker.commerce.price({ min: basePrice * 0.9, max: basePrice * 1.2 })),
                        sku: `${product.sku}-V${v + 1}`,
                        inventory: faker.number.int({ min: 0, max: 50 }),
                        options: JSON.stringify([
                            { name: 'Size', value: faker.helpers.arrayElement(['Small', 'Medium', 'Large', 'X-Large']) },
                            { name: 'Color', value: faker.color.human() }
                        ]),
                        updatedAt: new Date() // Add required updatedAt field
                    }
                });
            }

            // Create 1-5 product images
            const numImages = faker.number.int({ min: 1, max: 5 });
            for (let img = 0; img < numImages; img++) {
                await prisma.productImage.create({
                    data: {
                        productId: product.id,
                        url: `https://picsum.photos/seed/${product.id}-${img}/800/800`,
                        alt: `Image of ${product.name}`,
                        position: img,
                        updatedAt: new Date() // Add required updatedAt field
                    }
                });
            }

            products.push(product);
        }
    }

    return products;
}

async function createUsers() {
    console.log('👤 Creating users...');

    const users = [];
    const numUsers = 10;

    for (let i = 0; i < numUsers; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const user = await prisma.user.create({
            data: {
                name: `${firstName} ${lastName}`,
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                image: faker.image.avatar(),
                emailVerified: faker.date.past()
            }
        });

        users.push(user);
    }

    return users;
}

async function createReviews(products: any[], users: any[]) {
    console.log('✍️ Creating product reviews...');

    const reviews = [];

    // Create 0-5 reviews for each product
    for (const product of products) {
        // 70% chance a product has reviews
        if (faker.datatype.boolean(0.7)) {
            const numReviews = faker.number.int({ min: 1, max: 5 });

            for (let i = 0; i < numReviews; i++) {
                // Pick a random user
                const user = faker.helpers.arrayElement(users);

                const review = await prisma.review.create({
                    data: {
                        productId: product.id,
                        userId: user.id,
                        rating: faker.number.int({ min: 1, max: 5 }),
                        title: faker.datatype.boolean(0.6) ? faker.lorem.sentence({ min: 2, max: 6 }) : null,
                        content: faker.lorem.paragraph(),
                        status: 'APPROVED',
                        createdAt: faker.date.past({ years: 1 }),
                        updatedAt: faker.date.recent({ days: 30 })
                    }
                });

                reviews.push(review);
            }
        }
    }

    return reviews;
}

main()
    .catch((e) => {
        console.error('❌ Error during seed process:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });