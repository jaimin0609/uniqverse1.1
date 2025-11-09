#!/usr/bin/env node

/**
 * Vercel Environment Variables Check Guide
 * 
 * This guide helps you check and fix your Vercel environment variables
 */

console.log('🔍 VERCEL ENVIRONMENT VARIABLES CHECK\n');

console.log('📋 STEP 1: Check Vercel Environment Variables');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Find your Uniqverse project');
console.log('3. Click on the project');
console.log('4. Go to "Settings" tab');
console.log('5. Click "Environment Variables" in the left sidebar\n');

console.log('✅ REQUIRED ENVIRONMENT VARIABLES:');
console.log('Make sure these are set in Vercel:\n');

console.log('🔑 DATABASE_URL');
console.log('Value should be: postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres');
console.log('⚠️  Important: Use the DIRECT connection (port 5432), not pooling\n');

console.log('🔑 NEXTAUTH_URL');
console.log('Value should be: https://uselfunik.com');
console.log('(Replace with your actual Vercel domain)\n');

console.log('🔑 NEXTAUTH_SECRET');
console.log('Value should be: your-nextauth-secret-key-here\n');

console.log('📋 STEP 2: Get Correct Supabase DATABASE_URL');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > Database');
console.log('4. Find "Connection string" section');
console.log('5. Copy the "URI" connection string');
console.log('6. Replace [YOUR-PASSWORD] with your actual password\n');

console.log('🔧 STEP 3: Update Vercel Environment Variables');
console.log('1. In Vercel Settings > Environment Variables');
console.log('2. Find DATABASE_URL and click "Edit"');
console.log('3. Paste the correct Supabase connection string');
console.log('4. Make sure it\'s enabled for "Production"');
console.log('5. Click "Save"\n');

console.log('🚀 STEP 4: Force Redeploy');
console.log('1. Go to Vercel Deployments tab');
console.log('2. Click "..." on latest deployment');
console.log('3. Click "Redeploy"');
console.log('4. Select "Use existing Build Cache: No"');
console.log('5. Click "Redeploy"\n');

console.log('⚠️  CRITICAL: The DATABASE_URL format matters!');
console.log('❌ Wrong: prisma://xxx or pooling URL');
console.log('✅ Correct: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres');
