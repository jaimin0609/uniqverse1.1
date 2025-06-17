#!/usr/bin/env node

/**
 * 404 Error Debugging Script
 * 
 * This script helps diagnose and fix the 404 error on the deployed site
 */

// Import required packages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSING 404 ERROR ON DEPLOYED SITE\n');
console.log('The 404 error you\'re seeing is likely due to one of these issues:\n');

console.log('1️⃣ NEXTAUTH_URL CONFIGURATION:');
console.log('   - The vercel.json file has been updated to use proper variable format');
console.log('   - NEXTAUTH_URL should now be ${VERCEL_URL}\n');

console.log('2️⃣ DEFAULT BRANCH CONFIGURATION:');
console.log('   - Ensure your Vercel project is using the correct production branch');
console.log('   - Go to Vercel Dashboard > Project Settings > Git > Production Branch\n');

console.log('3️⃣ ENVIRONMENT VARIABLES:');
console.log('   - Check all required environment variables are set in Vercel');
console.log('   - NEXTAUTH_SECRET is critical for authentication\n');

console.log('4️⃣ NEXTJS TELEMETRY:');
console.log('   - Disable Next.js telemetry (optional)');
console.log('   - Run: npx next telemetry disable\n'); 

console.log('🚀 IMMEDIATE FIXES:');
console.log('1. Push the updated vercel.json to your repository');
console.log('2. Go to Vercel Dashboard > Deployments');
console.log('3. Find the latest deployment');
console.log('4. Click the "..." menu and select "Redeploy"');
console.log('5. Choose "Use existing Build Cache: No"\n');

console.log('✅ MANUAL URL CHECK: Try visiting these paths directly:');
console.log('   - https://your-site-name.vercel.app/shop');
console.log('   - https://your-site-name.vercel.app/api/health');

// Prepare fix for vercel.json
try {
  console.log('\n🔧 Checking for the vercel.json updates...');
  
  const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  if (vercelJson.env && vercelJson.env.NEXTAUTH_URL === '${VERCEL_URL}') {
    console.log('✅ vercel.json has already been updated with the proper NEXTAUTH_URL format.');
  } else {
    console.log('⚠️ Please ensure vercel.json has been committed and pushed.');
  }
  
} catch (error) {
  console.error('❌ Error reading vercel.json:', error.message);
}

console.log('\n📋 FINAL REMINDER:');
console.log('After pushing changes and redeploying, check your Vercel Functions logs');
console.log('They often contain more detailed error information that can help identify the issue.');
