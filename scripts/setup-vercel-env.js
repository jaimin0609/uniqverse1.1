#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * Helps set up production environment variables for Uniqverse
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Vercel Environment Variables Setup for Uniqverse');
console.log('====================================================\n');

const envVars = [{
  name: 'DATABASE_URL',
  description: 'Supabase PostgreSQL database URL',
  example: 'postgresql://postgres:[YOUR_PASSWORD]@db.gtifoyguebybdybglvuc.supabase.co:5432/postgres',
  required: true,
  default: 'postgresql://postgres:[YOUR_PASSWORD]@db.gtifoyguebybdybglvuc.supabase.co:5432/postgres'
},
{
  name: 'SUPABASE_URL',
  description: 'Supabase project URL',
  example: 'https://gtifoyguebybdybglvuc.supabase.co',
  required: false,
  default: 'https://gtifoyguebybdybglvuc.supabase.co'
},
{
  name: 'SUPABASE_ANON_KEY',
  description: 'Supabase anonymous key',
  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  required: false,
  default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aWZveWd1ZWJ5YmR5YmdsdnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjk2NzQsImV4cCI6MjA2NTcwNTY3NH0.Tvpz3UMH0Rlb_SMNHs5HizXL3ZL8u6DTLr1tVMnnSLc'
},
{
  name: 'NEXTAUTH_SECRET',
  description: 'Secret key for NextAuth.js (generate with: openssl rand -base64 32)',
  example: 'your-generated-secret-key',
  required: true
},
{
  name: 'NEXTAUTH_URL',
  description: 'Production URL of your application',
  example: 'https://uselfunik.com',
  required: true
},
{
  name: 'STRIPE_SECRET_KEY',
  description: 'Stripe secret key (production: sk_live_... or test: sk_test_...)',
  example: 'sk_test_...',
  required: true
},
{
  name: 'STRIPE_PUBLISHABLE_KEY',
  description: 'Stripe publishable key',
  example: 'pk_test_...',
  required: true
},
{
  name: 'STRIPE_WEBHOOK_SECRET',
  description: 'Stripe webhook secret (from Stripe dashboard)',
  example: 'whsec_...',
  required: true
},
{
  name: 'UPSTASH_REDIS_REST_URL',
  description: 'Upstash Redis REST URL',
  example: 'https://your-redis.upstash.io',
  required: true
},
{
  name: 'UPSTASH_REDIS_REST_TOKEN',
  description: 'Upstash Redis REST Token',
  example: 'AXXXyyy...',
  required: true
},
{
  name: 'CLOUDINARY_CLOUD_NAME',
  description: 'Cloudinary cloud name',
  example: 'your-cloud-name',
  required: true
},
{
  name: 'CLOUDINARY_API_KEY',
  description: 'Cloudinary API key',
  example: '123456789012345',
  required: true
},
{
  name: 'CLOUDINARY_API_SECRET',
  description: 'Cloudinary API secret',
  example: 'your-api-secret',
  required: true
},
{
  name: 'SMTP_HOST',
  description: 'SMTP host for email',
  example: 'smtp.gmail.com',
  required: false,
  default: 'smtp.gmail.com'
},
{
  name: 'SMTP_PORT',
  description: 'SMTP port',
  example: '587',
  required: false,
  default: '587'
},
{
  name: 'SMTP_USER',
  description: 'SMTP username (email)',
  example: 'your-email@gmail.com',
  required: false
},
{
  name: 'SMTP_PASS',
  description: 'SMTP password (app password for Gmail)',
  example: 'your-app-password',
  required: false
},
{
  name: 'SMTP_FROM',
  description: 'From email address',
  example: 'noreply@yourdomain.com',
  required: false
}
];

const setupCommands = [];

async function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironmentVariables() {
  console.log('📋 We\'ll help you set up environment variables for production.\n');
  console.log('💡 Tips:');
  console.log('   • Press Enter to skip optional variables');
  console.log('   • Use default values where provided');
  console.log('   • Make sure you have your external service credentials ready\n');

  const proceed = await askQuestion('Ready to proceed? (y/N): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }

  console.log('\n🔧 Setting up environment variables...\n');

  for (const envVar of envVars) {
    console.log(`\n📍 ${envVar.name}`);
    console.log(`   Description: ${envVar.description}`);
    console.log(`   Example: ${envVar.example}`);

    if (envVar.default) {
      console.log(`   Default: ${envVar.default}`);
    }

    const required = envVar.required ? ' (REQUIRED)' : ' (optional)';
    const prompt = `   Enter value${required}: `;

    let value = await askQuestion(prompt);

    // Use default if no value provided and default exists
    if (!value && envVar.default) {
      value = envVar.default;
      console.log(`   Using default: ${value}`);
    }

    // Skip if no value and not required
    if (!value && !envVar.required) {
      console.log(`   Skipping ${envVar.name}`);
      continue;
    }

    // Require value for required variables
    if (!value && envVar.required) {
      console.log(`   ❌ ${envVar.name} is required!`);
      value = await askQuestion('   Please enter a value: ');
    }

    if (value) {
      setupCommands.push(`vercel env add ${envVar.name} production`);
      console.log(`   ✅ Will set ${envVar.name}`);
    }
  }

  console.log('\n📋 Setup Summary:');
  console.log('==================');

  if (setupCommands.length === 0) {
    console.log('No environment variables to set up.');
    rl.close();
    return;
  }

  console.log(`${setupCommands.length} environment variables will be configured.\n`);

  const confirm = await askQuestion('Execute setup commands? (y/N): ');

  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    console.log('\n🚀 Executing Vercel environment setup...\n');

    console.log('⚠️  Important: You\'ll need to enter each value when prompted by Vercel CLI.\n');

    for (const command of setupCommands) {
      console.log(`Running: ${command}`);
      try {
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Success!\n');
      } catch (error) {
        console.log(`❌ Error running: ${command}`);
        console.log('Please run this command manually.\n');
      }
    }

    console.log('🎉 Environment variables setup complete!');
    console.log('\nNext steps:');
    console.log('1. Verify variables: vercel env ls');
    console.log('2. Deploy to production: vercel --prod');

  } else {
    console.log('\nSetup cancelled. You can run individual commands manually:');
    setupCommands.forEach(cmd => console.log(`  ${cmd}`));
  }

  rl.close();
}

setupEnvironmentVariables().catch(console.error);
