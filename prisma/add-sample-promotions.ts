// This script adds a sample promotion to the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Delete existing promotions
    await prisma.promotion.deleteMany({});

    console.log('Creating sample promotions...');

    // Create a banner promotion
    const bannerPromotion = await prisma.promotion.create({
        data: {
            title: "Spring Sale - 20% OFF Everything!",
            description: "Use code SPRING20 at checkout",
            type: "BANNER",
            linkUrl: "/shop?discount=spring",
            position: 0,
            startDate: new Date(), // starts now
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // ends in 14 days
            isActive: true,
        },
    });

    // Create a second promotion
    const secondPromotion = await prisma.promotion.create({
        data: {
            title: "SUMMER10",
            description: "Get 10% off on summer items",
            type: "BANNER",
            linkUrl: "/shop/summer",
            position: 1,
            startDate: new Date(), // starts now
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ends in 30 days
            isActive: true,
        },
    });

    console.log('Sample promotions created successfully:');
    console.log(bannerPromotion);
    console.log(secondPromotion);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
