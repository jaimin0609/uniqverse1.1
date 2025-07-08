// Quick database connection test for Vercel
// Run: node scripts/test-db-connection.js

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log('🔍 Testing database connection...');
        console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
        
        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const productCount = await prisma.product.count();
        console.log(`✅ Found ${productCount} products in database`);
        
        // Test user count
        const userCount = await prisma.user.count();
        console.log(`✅ Found ${userCount} users in database`);
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        
        if (error.message.includes('Can\'t reach database server')) {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check if Supabase database is paused (free tier limitation)');
            console.log('2. Verify DATABASE_URL environment variable');
            console.log('3. Check network connectivity');
            console.log('4. Try using direct connection instead of pooler');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
