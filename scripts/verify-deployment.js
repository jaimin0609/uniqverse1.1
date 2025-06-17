#!/usr/bin/env node

/**
 * Production Site Verification
 * 
 * Use this to verify your deployed site is working correctly
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔍 PRODUCTION SITE VERIFICATION\n');

rl.question('Enter your Vercel deployment URL (e.g., https://your-site.vercel.app): ', (url) => {
    console.log('\n✅ VERIFICATION CHECKLIST:\n');
    
    console.log('🌐 BASIC FUNCTIONALITY:');
    console.log(`1. Visit: ${url}`);
    console.log('   - Homepage loads correctly');
    console.log('   - No console errors');
    console.log('   - Images display properly\n');
    
    console.log('🛒 E-COMMERCE FEATURES:');
    console.log(`2. Shop: ${url}/shop`);
    console.log('   - Products load correctly');
    console.log('   - Categories work');
    console.log('   - Search functionality\n');
    
    console.log('👤 USER FEATURES:');
    console.log(`3. Authentication: ${url}/auth/login`);
    console.log('   - Login/register forms work');
    console.log('   - Password reset functionality\n');
    
    console.log('⚙️ ADMIN DASHBOARD:');
    console.log(`4. Admin: ${url}/admin`);
    console.log('   - Dashboard loads');
    console.log('   - Database connections work');
    console.log('   - All admin features functional\n');
    
    console.log('🔧 API ENDPOINTS:');
    console.log(`5. Health Check: ${url}/api/health`);
    console.log(`6. Metrics: ${url}/api/metrics`);
    console.log('   - Should return JSON responses\n');
    
    console.log('✅ SUCCESS INDICATORS:');
    console.log('- No 500/database errors');
    console.log('- All pages load quickly');
    console.log('- Products display correctly');
    console.log('- Admin dashboard accessible');
    console.log('- Cart functionality works\n');
    
    console.log('🎉 If all checks pass, your deployment is successful!');
    
    rl.close();
});
