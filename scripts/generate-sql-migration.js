#!/usr/bin/env node

/**
 * Generate SQL Migration Script for Supabase
 * 
 * This script generates a complete SQL migration that can be run
 * in the Supabase SQL Editor to create all tables.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Generating SQL migration for Supabase...\n');

try {
    // Generate the SQL migration
    const sqlOutput = execSync(
        'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
        { encoding: 'utf8' }
    );

    // Write to file
    const outputPath = path.join(__dirname, '..', 'migration.sql');
    fs.writeFileSync(outputPath, sqlOutput);

    console.log('✅ SQL migration generated successfully!');
    console.log(`📁 File saved to: ${outputPath}\n`);

    console.log('📋 NEXT STEPS:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy and paste the contents of migration.sql');
    console.log('4. Run the SQL script');
    console.log('5. Verify tables are created in the Table Editor');
    console.log('6. Redeploy to Vercel\n');

    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project-id]/sql\n');

    // Display first few lines of the migration
    const lines = sqlOutput.split('\n').slice(0, 10);
    console.log('📝 Migration preview:');
    console.log('```sql');
    lines.forEach(line => console.log(line));
    if (sqlOutput.split('\n').length > 10) {
        console.log('... (and more)');
    }
    console.log('```\n');

} catch (error) {
    console.error('❌ Error generating migration:', error.message);
    
    if (error.message.includes('prisma')) {
        console.log('\n💡 Try running: npm install @prisma/client prisma');
    }
    
    process.exit(1);
}
