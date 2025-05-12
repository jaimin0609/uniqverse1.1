import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating sample events...');

    // Clear any existing events
    await prisma.event.deleteMany({});

    // Create sample events
    const events = await Promise.all([
        // Event 1: Summer Sale Banner
        prisma.event.create({
            data: {
                title: 'Summer Sale',
                description: 'Up to 70% off on selected items',
                imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
                contentType: 'image',
                textOverlay: 'Summer Sale - Up to 70% OFF',
                textPosition: 'center',
                textColor: '#FFFFFF',
                textSize: 'text-4xl',
                textShadow: true,
                opacity: 100,
                effectType: 'fade',
                linkUrl: '/shop/sale',
                startDate: new Date(),
                endDate: addDays(new Date(), 30),
                isActive: true,
                position: 0,
            },
        }),

        // Event 2: New Collection
        prisma.event.create({
            data: {
                title: 'New Collection',
                description: 'Check out our latest arrivals',
                imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
                contentType: 'image',
                textOverlay: 'Discover our latest collection',
                textPosition: 'bottom-center',
                textColor: '#FFFFFF',
                textSize: 'text-3xl',
                textShadow: true,
                opacity: 90,
                effectType: 'zoom',
                linkUrl: '/shop/new',
                startDate: addDays(new Date(), 1),
                endDate: addDays(new Date(), 45),
                isActive: true,
                position: 1,
            },
        }),

        // Event 3: Limited Edition
        prisma.event.create({
            data: {
                title: 'Limited Edition',
                description: 'Exclusive products for a limited time',
                imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a',
                contentType: 'image',
                textOverlay: 'Limited Edition Collection - Shop Now',
                textPosition: 'center-left',
                textColor: '#FFFFFF',
                textSize: 'text-2xl',
                textShadow: true,
                opacity: 100,
                effectType: 'slide',
                linkUrl: '/shop/limited-edition',
                startDate: new Date(),
                endDate: addDays(new Date(), 14),
                isActive: true,
                position: 2,
            },
        }),
    ]);

    console.log(`Created ${events.length} sample events`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
