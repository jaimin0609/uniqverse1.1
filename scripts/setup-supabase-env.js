#!/usr/bin/env node

/**
 * Quick Supabase + Vercel Environment Setup
 * Sets up your Supabase configuration for production
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗄️  Supabase + Vercel Environment Setup');
console.log('========================================\n');

const supabaseConfig = {
  url: 'https://gtifoyguebybdybglvuc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aWZveWd1ZWJ5YmR5YmdsdnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjk2NzQsImV4cCI6MjA2NTcwNTY3NH0.Tvpz3UMH0Rlb_SMNHs5HizXL3ZL8u6DTLr1tVMnnSLc'
};

async function promptForInput(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setVercelEnv(name, value, environment = 'production') {
  try {
    console.log(`Setting ${name}...`);
    execSync(`vercel env add ${name} ${environment}`, {
      input: `${value}\n`,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(`✅ ${name} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${name}:`, error.message);
  }
}

async function main() {
  console.log('📋 We\'ll set up your Supabase configuration for Vercel production environment.\n');
  
  // Get Supabase database password
  const dbPassword = await promptForInput('Enter your Supabase database password');
  
  if (!dbPassword) {
    console.log('❌ Database password is required. You can find it in your Supabase dashboard under Settings > Database.');
    process.exit(1);
  }

  // Get production domain
  const domain = await promptForInput('Enter your production domain', 'uniqverse-v1.vercel.app');
  
  // Generate NextAuth secret
  const nextAuthSecret = await promptForInput('Enter NextAuth secret (or press Enter to generate)', '');
  const finalNextAuthSecret = nextAuthSecret || require('crypto').randomBytes(32).toString('base64');

  console.log('\n🚀 Setting up environment variables in Vercel...\n');

  // Set all environment variables
  const envVars = [
    ['DATABASE_URL', `postgresql://postgres:${dbPassword}@db.gtifoyguebybdybglvuc.supabase.co:5432/postgres`],
    ['SUPABASE_URL', supabaseConfig.url],
    ['SUPABASE_ANON_KEY', supabaseConfig.anonKey],
    ['NEXTAUTH_SECRET', finalNextAuthSecret],
    ['NEXTAUTH_URL', `https://${domain}`]
  ];

  for (const [name, value] of envVars) {
    await setVercelEnv(name, value);
  }

  console.log('\n✅ Supabase configuration complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Stripe keys (run the main setup script)');
  console.log('2. Configure Cloudinary for image management');
  console.log('3. Set up Redis/Upstash for caching');
  console.log('4. Deploy to production: vercel --prod');
  
  rl.close();
}

main().catch(console.error);
