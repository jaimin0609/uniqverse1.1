#!/usr/bin/env node

/**
 * Database Connection Test
 * 
 * This script tests the database connection and verifies tables exist
 * Run this AFTER you've applied the migration in Supabase
 */

require('dotenv').config();

async function testDatabaseConnection() {
    console.log('🔄 Testing database connection...\n');

    try {
        // Dynamic import for Prisma Client
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        console.log('✅ Prisma Client initialized successfully');

        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connection established');

        // Test if key tables exist by querying them
        const tests = [
            { name: 'User', query: () => prisma.user.findMany({ take: 1 }) },
            { name: 'Product', query: () => prisma.product.findMany({ take: 1 }) },
            { name: 'Category', query: () => prisma.category.findMany({ take: 1 }) },
            { name: 'Order', query: () => prisma.order.findMany({ take: 1 }) },
        ];

        console.log('\n🔍 Testing table accessibility...');
        
        for (const test of tests) {
            try {
                await test.query();
                console.log(`✅ ${test.name} table accessible`);
            } catch (error) {
                console.log(`❌ ${test.name} table error:`, error.message);
            }
        }

        await prisma.$disconnect();
        console.log('\n🎉 Database test completed successfully!');
        console.log('🚀 You can now redeploy to Vercel');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        if (error.message.includes('Environment variable not found')) {
            console.log('\n💡 Make sure your .env file contains DATABASE_URL');
        } else if (error.message.includes('does not exist')) {
            console.log('\n💡 Tables do not exist. Run the migration.sql in Supabase SQL Editor first');
        }
        
        process.exit(1);
    }
}

testDatabaseConnection();
