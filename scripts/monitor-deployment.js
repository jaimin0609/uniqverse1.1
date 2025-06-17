#!/usr/bin/env node

/**
 * Monitor Deployment Progress
 * 
 * This script helps monitor the Vercel deployment and checks when it's ready
 */

const https = require('https');

const DEPLOYMENT_URL = 'https://uniqverse-v1-g9bbwkzhl-jaimin0609s-projects.vercel.app';
const PRODUCTION_URL = 'https://uniqverse-v1.vercel.app';

console.log('🔄 Monitoring deployment progress...\n');

let checkCount = 0;
const maxChecks = 30; // Maximum 5 minutes (30 checks * 10 seconds)

function checkDeployment() {
  checkCount++;
  
  if (checkCount > maxChecks) {
    console.log('⏰ Timeout reached. Please check Vercel dashboard manually.');
    process.exit(1);
  }

  const currentTime = new Date().toLocaleTimeString();
  console.log(`[${currentTime}] Check #${checkCount} - Testing deployment...`);

  // Test health endpoint first
  https.get(`${DEPLOYMENT_URL}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Deployment is live! Testing homepage...');
      
      // Now test homepage
      https.get(DEPLOYMENT_URL, (homeRes) => {
        if (homeRes.statusCode === 200) {
          console.log(`🎉 SUCCESS! Deployment is working at: ${DEPLOYMENT_URL}`);
          console.log(`🚀 Production URL: ${PRODUCTION_URL}`);
          console.log('\n📋 Next steps:');
          console.log('1. Test the site thoroughly');
          console.log('2. Check all major routes work');
          console.log('3. Verify database connections');
          console.log('4. Test the authentication system');
          process.exit(0);
        } else {
          console.log(`⚠️ API works but homepage returns ${homeRes.statusCode} - still deploying...`);
          setTimeout(checkDeployment, 10000); // Check again in 10 seconds
        }
      }).on('error', (err) => {
        console.log(`❌ Homepage check failed: ${err.message} - retrying...`);
        setTimeout(checkDeployment, 10000);
      });
      
    } else {
      console.log(`⏳ Status ${res.statusCode} - deployment still in progress...`);
      setTimeout(checkDeployment, 10000); // Check again in 10 seconds
    }
  }).on('error', (err) => {
    console.log(`⏳ Connection failed: ${err.message} - deployment likely still building...`);
    setTimeout(checkDeployment, 10000); // Check again in 10 seconds
  });
}

console.log('Starting deployment monitoring...');
console.log(`Target URL: ${DEPLOYMENT_URL}`);
console.log('This will check every 10 seconds for up to 5 minutes.\n');

// Start monitoring
checkDeployment();
