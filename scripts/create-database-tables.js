#!/usr/bin/env node

/**
 * Script to create database tables using the production DATABASE_URL
 */

const { execSync } = require('child_process');

console.log('🗄️  Creating Database Tables for Uniqverse');
console.log('==========================================\n');

// The DATABASE_URL that works in production
const productionDatabaseUrl = 'postgresql://postgres:Database6941%40Sjp@db.gtifoyguebybdybglvuc.supabase.co:5432/postgres';

console.log('Using production DATABASE_URL to create tables...');
console.log('Database: db.gtifoyguebybdybglvuc.supabase.co');
console.log('Schema: public\n');

try {
    // Set the DATABASE_URL temporarily and run db push
    process.env.DATABASE_URL = productionDatabaseUrl;
    
    console.log('🔄 Running: npx prisma db push');
    execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: productionDatabaseUrl }
    });
    
    console.log('\n✅ Database tables created successfully!');
    console.log('📋 You should now see tables in your Supabase dashboard under:');
    console.log('   Database > Tables > Schema: public');
    
} catch (error) {
    console.error('\n❌ Error creating database tables:', error.message);
    console.log('\n🔧 Manual steps to create tables:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Database > SQL Editor');
    console.log('3. Create a new query and paste the schema from prisma/schema.prisma');
    console.log('4. Or use the Supabase CLI if available');
}
