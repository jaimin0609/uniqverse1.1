#!/usr/bin/env node

/**
 * Quick Supabase Environment Setup for Uniqverse
 * Sets up Supabase database configuration automatically
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Supabase Environment Setup for Uniqverse');
console.log('============================================\n');

// Pre-configured Supabase details
const supabaseConfig = {
  projectUrl: 'https://gtifoyguebybdybglvuc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aWZveWd1ZWJ5YmR5YmdsdnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjk2NzQsImV4cCI6MjA2NTcwNTY3NH0.Tvpz3UMH0Rlb_SMNHs5HizXL3ZL8u6DTLr1tVMnnSLc',
  password: 'Database6941@Sjp'
};

// Construct DATABASE_URL for Prisma
const databaseUrl = `postgresql://postgres:${encodeURIComponent(supabaseConfig.password)}@db.gtifoyguebybdybglvuc.supabase.co:5432/postgres`;

async function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSupabase() {
  console.log('📋 Supabase Configuration Detected:');
  console.log(`   Project URL: ${supabaseConfig.projectUrl}`);
  console.log(`   Database: gtifoyguebybdybglvuc.supabase.co`);
  console.log(`   Connection: Prisma-compatible PostgreSQL\n`);
  
  const proceed = await askQuestion('Set up Supabase environment variables? (Y/n): ');
  if (proceed.toLowerCase() === 'n' || proceed.toLowerCase() === 'no') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }

  console.log('\n🔧 Setting up Supabase environment variables...\n');

  // Essential variables for production
  const envVars = [
    {
      name: 'DATABASE_URL',
      value: databaseUrl,
      description: 'Supabase PostgreSQL connection string'
    },
    {
      name: 'SUPABASE_URL',
      value: supabaseConfig.projectUrl,
      description: 'Supabase project URL'
    },
    {
      name: 'SUPABASE_ANON_KEY',
      value: supabaseConfig.anonKey,
      description: 'Supabase anonymous key'
    }
  ];

  try {
    for (const envVar of envVars) {
      console.log(`Setting ${envVar.name}...`);
      console.log(`Description: ${envVar.description}`);
      
      // Set the environment variable in Vercel
      const command = `echo ${envVar.value} | vercel env add ${envVar.name} production`;
      execSync(command, { stdio: 'pipe' });
      
      console.log(`✅ ${envVar.name} set successfully\n`);
    }

    console.log('🎉 Supabase environment variables configured successfully!\n');
    
    console.log('📋 Summary:');
    console.log('   ✅ DATABASE_URL - Prisma connection to Supabase');
    console.log('   ✅ SUPABASE_URL - Supabase project URL');
    console.log('   ✅ SUPABASE_ANON_KEY - Supabase client key\n');
    
    console.log('🔄 Next Steps:');
    console.log('   1. Set up remaining environment variables (NextAuth, Stripe, etc.)');
    console.log('   2. Run database migrations: npx prisma db push');
    console.log('   3. Deploy to production: vercel --prod\n');
    
    const setupMore = await askQuestion('Set up additional environment variables now? (Y/n): ');
    if (setupMore.toLowerCase() !== 'n' && setupMore.toLowerCase() !== 'no') {
      console.log('\n🚀 Starting full environment setup...\n');
      rl.close();
      
      // Run the full setup script
      execSync('node scripts/setup-vercel-env.js', { stdio: 'inherit' });
    } else {
      console.log('\nYou can run the full setup later with: node scripts/setup-vercel-env.js');
      rl.close();
    }
    
  } catch (error) {
    console.error('❌ Error setting up environment variables:', error.message);
    console.log('\n🔧 Manual Setup Commands:');
    envVars.forEach(envVar => {
      console.log(`vercel env add ${envVar.name} production`);
      console.log(`# Value: ${envVar.value}\n`);
    });
    rl.close();
  }
}

setupSupabase().catch(console.error);
