#!/bin/bash

# Uniqverse Production Environment Setup Script
# This script helps set up environment variables and services for production

echo "🚀 Uniqverse Production Environment Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
else
    echo "⚠️  .env file already exists. Please review and update manually."
fi

echo ""
echo "📋 Production Setup Checklist:"
echo ""

echo "1. Database Setup:"
echo "   □ Create production database (Supabase/Neon/PlanetScale)"
echo "   □ Update DATABASE_URL in .env or Vercel environment"
echo "   □ Run: npx prisma migrate deploy"
echo ""

echo "2. Redis Setup (Upstash):"
echo "   □ Create Upstash Redis instance"
echo "   □ Update UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
echo ""

echo "3. Stripe Payment Setup:"
echo "   □ Activate Stripe live mode"
echo "   □ Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY (live keys)"
echo "   □ Configure webhook endpoint: https://yourdomain.com/api/webhooks/stripe"
echo ""

echo "4. Email Configuration:"
echo "   □ Set up production email service"
echo "   □ Update SMTP_* variables"
echo "   □ Configure SPF/DKIM/DMARC records"
echo ""

echo "5. Cloudinary Setup:"
echo "   □ Upgrade to production plan if needed"
echo "   □ Update CLOUDINARY_* variables"
echo ""

echo "6. NextAuth Configuration:"
echo "   □ Generate secure NEXTAUTH_SECRET: openssl rand -base64 32"
echo "   □ Update NEXTAUTH_URL to your production domain"
echo ""

echo "7. Vercel Deployment:"
echo "   □ Install Vercel CLI: npm i -g vercel"
echo "   □ Login: vercel login"
echo "   □ Link project: vercel link"
echo "   □ Set environment variables in Vercel dashboard"
echo "   □ Deploy: vercel --prod"
echo ""

echo "8. Post-Deployment:"
echo "   □ Test health check: https://yourdomain.com/api/health"
echo "   □ Test complete user flow"
echo "   □ Monitor error rates and performance"
echo ""

echo "🔧 Quick Commands:"
echo "=================="
echo ""
echo "# Generate secure NextAuth secret:"
echo "openssl rand -base64 32"
echo ""
echo "# Run database migrations:"
echo "npx prisma migrate deploy"
echo ""
echo "# Deploy to production:"
echo "vercel --prod"
echo ""
echo "# Check production health:"
echo "curl https://yourdomain.com/api/health"
echo ""

echo "📚 Documentation:"
echo "=================="
echo "• Production Deployment Guide: docs/PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "• Environment Variables: .env.example"
echo "• CI/CD Pipeline: .github/workflows/deploy.yml"
echo ""

echo "✅ Setup script completed!"
echo "Please review the checklist above and complete each step."
