#!/usr/bin/env node

/**
 * Verify Deployment Script
 * 
 * This script helps verify the deployment status and check key routes
 */
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔍 DEPLOYMENT VERIFICATION\n');

// Ask for deployment URL
rl.question('What is your Vercel deployment URL? (e.g., https://your-site.vercel.app) ', (deploymentUrl) => {
  if (!deploymentUrl.startsWith('http')) {
    deploymentUrl = 'https://' + deploymentUrl;
  }
  
  // Remove trailing slash if present
  if (deploymentUrl.endsWith('/')) {
    deploymentUrl = deploymentUrl.slice(0, -1);
  }
  
  console.log(`\n🚀 Testing deployment at ${deploymentUrl}...\n`);
  
  // Routes to check
  const routes = [
    '/',
    '/shop',
    '/api/health',
    '/auth/login',
    '/not-found-test-route'
  ];
  
  // Check each route
  const checkRoute = (index) => {
    if (index >= routes.length) {
      console.log('\n✅ Route checking complete!');
      
      console.log(`
📋 NEXT STEPS:
1. If routes are returning 404s but you see successful builds in Vercel:
   - Ensure middleware.ts has proper matchers
   - Verify vercel.json configuration
   - Check environment variables in Vercel dashboard
   - Try a clean rebuild (clear cache)
   
2. Add this script tag to debug live:
   <script src="${deploymentUrl}/route-debug.js"></script>
`);
      rl.close();
      return;
    }
    
    const route = routes[index];
    const url = `${deploymentUrl}${route}`;
    
    process.stdout.write(`Checking ${url}... `);
    
    https.get(url, (res) => {
      const statusCode = res.statusCode;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (statusCode === 200) {
          console.log(`✅ Status ${statusCode} OK`);
        } else if (route === '/not-found-test-route' && statusCode === 404) {
          console.log(`✅ Status ${statusCode} (Expected 404 for test route)`);
        } else {
          console.log(`❌ Status ${statusCode}`);
        }
        
        // Check next route
        checkRoute(index + 1);
      });
    }).on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      checkRoute(index + 1);
    });
  };
  
  // Start checking routes
  checkRoute(0);
});
