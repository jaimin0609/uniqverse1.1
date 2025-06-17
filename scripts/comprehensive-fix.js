#!/usr/bin/env node

/**
 * Comprehensive Fix for 404 Error on Vercel Deployment
 * 
 * This script performs a comprehensive check and fix for various issues
 * that could cause 404 errors on Next.js applications deployed to Vercel.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running comprehensive fixes for 404 errors...\n');

// Function to update a file
function updateFile(filePath, check, replacement) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (typeof check === 'function') {
        if (check(content)) {
          content = replacement(content);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Updated ${path.basename(filePath)}`);
          return true;
        }
      } else {
        if (content.includes(check)) {
          content = content.replace(check, replacement);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Updated ${path.basename(filePath)}`);
          return true;
        }
      }
      console.log(`ℹ️ No changes needed in ${path.basename(filePath)}`);
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
  return false;
}

// 1. Check and fix vercel.json
console.log('\n1️⃣ Checking vercel.json configuration...');
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');

updateFile(vercelJsonPath, 
  (content) => {
    const json = JSON.parse(content);
    return !json.env || 
           json.env.NEXTAUTH_URL !== "${VERCEL_URL}" || 
           !json.env.NEXTAUTH_SECRET ||
           !json.buildCommand;
  },
  (content) => {
    const json = JSON.parse(content);
    
    if (!json.env) json.env = {};
    
    // Ensure correct NEXTAUTH_URL format
    json.env.NEXTAUTH_URL = "${VERCEL_URL}";
    
    // Make sure NEXTAUTH_SECRET is referenced
    json.env.NEXTAUTH_SECRET = "${NEXTAUTH_SECRET}";
    
    // Add build command to ensure proper Prisma generation
    json.buildCommand = "prisma generate && next build";
    
    return JSON.stringify(json, null, 2);
  }
);

// 2. Check and fix next.config.js - ensure basePath and trailingSlash are set correctly
console.log('\n2️⃣ Checking next.config.js configuration...');
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');

updateFile(nextConfigPath,
  (content) => {
    // Check if certain key configurations are missing
    return !content.includes('trailingSlash') || 
           !content.includes('poweredByHeader');
  },
  (content) => {
    // Add missing configurations that might help with routing
    if (!content.includes('trailingSlash')) {
      content = content.replace(
        'const nextConfig = {',
        'const nextConfig = {\n  trailingSlash: false,'
      );
    }
    
    if (!content.includes('poweredByHeader')) {
      content = content.replace(
        'const nextConfig = {',
        'const nextConfig = {\n  poweredByHeader: false,'
      );
    }
    
    return content;
  }
);

// 3. Verify middleware.ts - make sure it's not blocking all routes
console.log('\n3️⃣ Checking middleware.ts configuration...');
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');

if (fs.existsSync(middlewarePath)) {
  console.log('ℹ️ Found middleware.ts - checking for potential issues...');
  
  // Add config for middleware.ts to ensure it's not causing 404s
  updateFile(middlewarePath,
    (content) => !content.includes('export const config'),
    (content) => {
      // Only add the config if it's not already present
      if (!content.includes('export const config')) {
        content += `\n\n// Define which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*']
};\n`;
      }
      return content;
    }
  );
} else {
  console.log('ℹ️ No middleware.ts found - skipping middleware check');
}

// 4. Create a health check API route if it doesn't exist
console.log('\n4️⃣ Ensuring health check API exists...');
const healthApiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'health', 'route.ts');

if (!fs.existsSync(healthApiPath)) {
  console.log('Creating health API route...');
  
  // Make sure the directory exists
  const healthApiDir = path.dirname(healthApiPath);
  if (!fs.existsSync(healthApiDir)) {
    fs.mkdirSync(healthApiDir, { recursive: true });
  }
  
  // Create the health API file
  fs.writeFileSync(healthApiPath, `
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
`, 'utf8');

  console.log('✅ Created health API route at /api/health');
}

// 5. Add _app.js for Pages Router compatibility (if app router is being used)
console.log('\n5️⃣ Checking for Pages Router fallbacks...');
const appDirExists = fs.existsSync(path.join(__dirname, '..', 'src', 'app'));
const pagesDirExists = fs.existsSync(path.join(__dirname, '..', 'src', 'pages'));

if (appDirExists && !pagesDirExists) {
  console.log('ℹ️ App Router detected, adding Pages Router compatibility layer...');
  
  // Create pages directory if it doesn't exist
  const pagesDir = path.join(__dirname, '..', 'src', 'pages');
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }
  
  // Create _app.js as a compatibility layer
  const appJsPath = path.join(pagesDir, '_app.js');
  if (!fs.existsSync(appJsPath)) {
    fs.writeFileSync(appJsPath, `
// Pages Router compatibility layer
import '../app/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
`, 'utf8');
    console.log('✅ Created Pages Router compatibility layer');
  }
}

// 6. Fix any potential db.ts issues
console.log('\n6️⃣ Checking db.ts Prisma initialization...');
const dbTsPath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');

updateFile(dbTsPath,
  (content) => content.includes('npm'),
  (content) => content.replace(/npm|npx/g, 'pnpm')
);

// 7. Generate route-debug helper
console.log('\n7️⃣ Updating route debugging utility...');
const routeDebugPath = path.join(__dirname, '..', 'public', 'route-debug.js');

fs.writeFileSync(routeDebugPath, `
// Next.js Route Debugging Script
// Add this to your HTML to debug: <script src="/route-debug.js"></script>

console.log("Enhanced Route Debugger activated");
window.addEventListener('DOMContentLoaded', (event) => {
  // Create debugging overlay
  const debugContainer = document.createElement('div');
  debugContainer.style = "position: fixed; top: 0; left: 0; right: 0; background: #333; color: white; padding: 10px; z-index: 9999; font-family: monospace; max-height: 80vh; overflow-y: auto;";
  
  // Hide/show toggle
  const toggleButton = document.createElement('button');
  toggleButton.innerText = "Toggle Debug Panel";
  toggleButton.style = "position: fixed; bottom: 10px; right: 10px; z-index: 10000; background: #555; color: white; border: none; padding: 8px; cursor: pointer;";
  toggleButton.onclick = () => {
    debugContainer.style.display = debugContainer.style.display === 'none' ? 'block' : 'none';
  };
  
  document.body.appendChild(toggleButton);
  
  // Build debug info
  const envInfo = {};
  
  // Check if Next.js is available
  if (window.__NEXT_DATA__) {
    envInfo.nextData = {
      buildId: window.__NEXT_DATA__.buildId,
      appRouter: Boolean(window.__NEXT_DATA__.app),
      props: JSON.stringify(window.__NEXT_DATA__.props).substring(0, 100) + '...'
    };
  }

  debugContainer.innerHTML = \`
    <h3>🔍 Uniqverse Route Debugger</h3>
    <p><strong>URL:</strong> \${window.location.href}</p>
    <p><strong>Path:</strong> \${window.location.pathname}</p>
    <p><strong>Query:</strong> \${window.location.search}</p>
    <p><strong>User Agent:</strong> \${navigator.userAgent}</p>
    <p><strong>Time:</strong> \${new Date().toISOString()}</p>
    <p><strong>Next.js Data:</strong> \${window.__NEXT_DATA__ ? 'Available' : 'Not Found'}</p>
    <hr>
    <h4>Navigation:</h4>
    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
      <button onclick="window.location='/'">Home</button>
      <button onclick="window.location='/shop'">Shop</button>
      <button onclick="window.location='/api/health'">API Health</button>
      <button onclick="window.location='/auth/login'">Login</button>
      <button onclick="window.location='/admin'">Admin</button>
      <button onclick="testApi()">Test API</button>
    </div>
    <hr>
    <div id="api-results">Testing API connection...</div>
  \`;
  
  document.body.appendChild(debugContainer);

  // API Test function
  window.testApi = () => {
    const apiResults = document.getElementById('api-results');
    apiResults.innerHTML = 'Testing API connection...';
    
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        apiResults.innerHTML = \`
          <div style="background: #070; padding: 10px; margin-top: 10px;">
            <h4>✅ API Health Check Success:</h4>
            <pre>\${JSON.stringify(data, null, 2)}</pre>
          </div>
        \`;
      })
      .catch(error => {
        apiResults.innerHTML = \`
          <div style="background: #700; padding: 10px; margin-top: 10px;">
            <h4>❌ API Health Check Error:</h4>
            <pre>\${error.message}</pre>
          </div>
        \`;
      });
  };
  
  // Auto-run API test
  window.testApi();
});
`, 'utf8');

console.log('✅ Created enhanced route debugging utility');

// 8. Create a 404 test page
console.log('\n8️⃣ Creating 404.js test page...');
const notFoundPath = path.join(__dirname, '..', 'src', 'app', 'not-found.tsx');

if (!fs.existsSync(notFoundPath)) {
  fs.writeFileSync(notFoundPath, `
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4 text-lg">The page you are looking for doesn't exist or has been moved.</p>
      
      <div className="mt-8 space-y-4">
        <p>Debug Information:</p>
        <ul className="list-disc text-left inline-block">
          <li>Timestamp: {new Date().toISOString()}</li>
          <li>Environment: {process.env.NODE_ENV}</li>
          <li>NEXTAUTH_URL is: {process.env.NEXTAUTH_URL || 'not set'}</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
      
      <script src="/route-debug.js" async></script>
    </div>
  );
}
`, 'utf8');
  console.log('✅ Created custom 404 page with debugging');
}

// 9. Create deployment check helper
console.log('\n9️⃣ Creating deployment verification script...');
const verifyDeployPath = path.join(__dirname, '..', 'scripts', 'verify-deployment.js');

fs.writeFileSync(verifyDeployPath, `#!/usr/bin/env node

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
  
  console.log(\`\n🚀 Testing deployment at \${deploymentUrl}...\n\`);
  
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
      
      console.log(\`
📋 NEXT STEPS:
1. If routes are returning 404s but you see successful builds in Vercel:
   - Ensure middleware.ts has proper matchers
   - Verify vercel.json configuration
   - Check environment variables in Vercel dashboard
   - Try a clean rebuild (clear cache)
   
2. Add this script tag to debug live:
   <script src="\${deploymentUrl}/route-debug.js"></script>
\`);
      rl.close();
      return;
    }
    
    const route = routes[index];
    const url = \`\${deploymentUrl}\${route}\`;
    
    process.stdout.write(\`Checking \${url}... \`);
    
    https.get(url, (res) => {
      const statusCode = res.statusCode;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (statusCode === 200) {
          console.log(\`✅ Status \${statusCode} OK\`);
        } else if (route === '/not-found-test-route' && statusCode === 404) {
          console.log(\`✅ Status \${statusCode} (Expected 404 for test route)\`);
        } else {
          console.log(\`❌ Status \${statusCode}\`);
        }
        
        // Check next route
        checkRoute(index + 1);
      });
    }).on('error', (err) => {
      console.log(\`❌ Error: \${err.message}\`);
      checkRoute(index + 1);
    });
  };
  
  // Start checking routes
  checkRoute(0);
});
`, 'utf8');

console.log('✅ Created deployment verification script');

// Make scripts executable
try {
  if (process.platform !== 'win32') {
    execSync(`chmod +x ${verifyDeployPath}`);
  }
  console.log('✅ Made script executable');
} catch (error) {
  console.log('⚠️ Could not make script executable:', error.message);
}

console.log(`
🎉 Comprehensive fixes applied!

🔶 Next Steps:
1. Commit and push these changes to GitHub
2. Trigger a clean deployment on Vercel:
   - Go to Vercel Dashboard > Deployments
   - Click "..." menu > "Redeploy" > "Use existing Build Cache: No"
   
3. After deployment, run the verification script:
   node scripts/verify-deployment.js
   
4. If you still see issues, check the debug panel by adding:
   <script src="/route-debug.js"></script> to your HTML

🚀 Good luck with your deployment!
`);
