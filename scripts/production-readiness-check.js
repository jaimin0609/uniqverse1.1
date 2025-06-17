const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Uniqverse Production Readiness Check');
console.log('==========================================\n');

const checks = [];

// Check if required files exist
const requiredFiles = [
  '.env.example',
  'vercel.json',
  'package.json',
  'prisma/schema.prisma',
  '.github/workflows/deploy.yml'
];

console.log('📁 File System Checks:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  checks.push({ name: `File: ${file}`, passed: exists });
});

// Check package.json scripts
console.log('\n📦 Package.json Scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'lint'];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`   ${exists ? '✅' : '❌'} ${script}`);
  checks.push({ name: `Script: ${script}`, passed: !!exists });
});

// Check for production dependencies
console.log('\n📚 Required Dependencies:');
const requiredDeps = [
  '@prisma/client',
  'next',
  'react',
  'next-auth'
];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
  checks.push({ name: `Dependency: ${dep}`, passed: !!exists });
});

// Check TypeScript configuration
console.log('\n🔧 TypeScript Configuration:');
try {
  const tsconfigExists = fs.existsSync('tsconfig.json');
  console.log(`   ${tsconfigExists ? '✅' : '❌'} tsconfig.json exists`);
  checks.push({ name: 'TypeScript config', passed: tsconfigExists });
  
  if (tsconfigExists) {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('   ✅ TypeScript compilation check passed');
    checks.push({ name: 'TypeScript compilation', passed: true });
  }
} catch (error) {
  console.log('   ❌ TypeScript compilation errors detected');
  checks.push({ name: 'TypeScript compilation', passed: false });
}

// Check linting
console.log('\n🧹 Code Quality:');
try {
  execSync('npm run lint -- --max-warnings 0', { stdio: 'pipe' });
  console.log('   ✅ ESLint check passed');
  checks.push({ name: 'ESLint', passed: true });
} catch (error) {
  console.log('   ❌ ESLint warnings or errors detected');
  checks.push({ name: 'ESLint', passed: false });
}

// Check if Prisma schema is valid
console.log('\n🗄️  Database Schema:');
try {
  execSync('npx prisma validate', { stdio: 'pipe' });
  console.log('   ✅ Prisma schema is valid');
  checks.push({ name: 'Prisma schema', passed: true });
} catch (error) {
  console.log('   ❌ Prisma schema validation failed');
  checks.push({ name: 'Prisma schema', passed: false });
}

// Check environment variables template
console.log('\n🔐 Environment Configuration:');
const envExample = fs.existsSync('.env.example');
if (envExample) {
  const envContent = fs.readFileSync('.env.example', 'utf8');
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STRIPE_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const exists = envContent.includes(envVar);
    console.log(`   ${exists ? '✅' : '❌'} ${envVar} template`);
    checks.push({ name: `Env var: ${envVar}`, passed: exists });
  });
}

// Summary
console.log('\n📊 Summary:');
const passed = checks.filter(check => check.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`   ${passed}/${total} checks passed (${percentage}%)`);

if (percentage >= 90) {
  console.log('\n🎉 Production readiness: EXCELLENT');
  console.log('   Your application is ready for production deployment!');
} else if (percentage >= 75) {
  console.log('\n⚠️  Production readiness: GOOD');
  console.log('   Address the failing checks before deploying to production.');
} else {
  console.log('\n❌ Production readiness: NEEDS WORK');
  console.log('   Please fix the failing checks before considering production deployment.');
}

// Failed checks
const failedChecks = checks.filter(check => !check.passed);
if (failedChecks.length > 0) {
  console.log('\n🔧 Failed Checks to Address:');
  failedChecks.forEach(check => {
    console.log(`   • ${check.name}`);
  });
}

console.log('\n📋 Next Steps:');
console.log('   1. Address any failed checks above');
console.log('   2. Set up production environment variables');
console.log('   3. Configure external services (database, Redis, Stripe, etc.)');
console.log('   4. Deploy to Vercel: vercel --prod');
console.log('   5. Test production deployment thoroughly');

process.exit(failedChecks.length > 0 ? 1 : 0);
