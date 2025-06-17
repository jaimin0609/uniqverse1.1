#!/usr/bin/env node

/**
 * Supabase Connection String Helper
 * 
 * This script helps you get the correct DATABASE_URL for your Supabase project
 */

console.log('🔧 SUPABASE CONNECTION STRING SETUP\n');

console.log('Please follow these steps to get the correct DATABASE_URL:\n');

console.log('1. 📋 Go to your Supabase Dashboard');
console.log('   https://supabase.com/dashboard\n');

console.log('2. 🎯 Select your project\n');

console.log('3. ⚙️ Go to Settings > Database\n');

console.log('4. 📄 Look for "Connection string" section\n');

console.log('5. 🔗 Copy the "URI" connection string (it should look like):');
console.log('   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres\n');

console.log('6. 🔒 Replace [YOUR-PASSWORD] with your actual database password\n');

console.log('7. ✏️ Update your .env file with the correct DATABASE_URL\n');

console.log('📝 IMPORTANT NOTES:');
console.log('- Use the direct connection string (port 5432), not pooling for migrations');
console.log('- Make sure your password is URL-encoded if it contains special characters');
console.log('- The database name should be "postgres" (not your project name)');
console.log('- Your current DATABASE_URL in .env might have an incorrect format\n');

console.log('🔄 SPECIAL CHARACTERS IN PASSWORD:');
console.log('If your password contains special characters, encode them:');
console.log('@ becomes %40');
console.log('# becomes %23'); 
console.log('$ becomes %24');
console.log('% becomes %25');
console.log('& becomes %26');
console.log('+ becomes %2B\n');

console.log('🧪 After updating .env, test with:');
console.log('node scripts/test-database.js\n');

console.log('🚨 IF CONNECTION STILL FAILS:');
console.log('1. Check if your Supabase project is paused');
console.log('2. Verify your database password is correct');
console.log('3. Try resetting your database password in Supabase Settings');
console.log('4. Make sure your IP is not blocked (Supabase allows all IPs by default)');
