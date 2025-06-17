# Uniqverse Production Deployment Guide

**Date**: June 14, 2025  
**Status**: Ready for Production Deployment  

## 🚀 **Phase 1: Vercel Deployment**

### **Prerequisites**
- [x] GitHub account with repository access
- [ ] Vercel account (free tier is sufficient for MVP)
- [ ] Production database setup
- [ ] Production Redis setup

### **Step 1: Vercel Account Setup**

1. **Create Vercel Account**
   ```bash
   # Go to https://vercel.com/signup
   # Sign up with your GitHub account
   # This will automatically connect your repositories
   ```

2. **Install Vercel CLI (Optional but Recommended)**
   ```bash
   npm install -g vercel
   vercel login
   ```

### **Step 2: Deploy to Vercel**

1. **From Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your GitHub repository `uniqverse-v1`
   - Vercel will automatically detect it's a Next.js project

2. **Configure Build Settings**
   - **Build Command**: `npm run build` (already configured in package.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

### **Step 3: Environment Variables Setup**

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```env
# Required for initial deployment
NEXTAUTH_SECRET=generate-a-random-32-character-string
NEXTAUTH_URL=https://your-app-name.vercel.app
```

**⚠️ Note**: We'll add database and other services in subsequent steps.

### **Step 4: Initial Deployment Test**

1. **Deploy**
   - Click "Deploy" in Vercel dashboard
   - Wait for build to complete
   - Check deployment URL

2. **Verify Basic Functionality**
   - [ ] Homepage loads
   - [ ] Navigation works
   - [ ] Static content displays
   - [ ] No critical errors in browser console

---

## 🗄️ **Phase 2: Database Setup**

### **Option A: Supabase (Recommended)**

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com
   # Create new project
   # Note down your database URL
   ```

2. **Configure Database**
   ```sql
   -- Supabase will provide PostgreSQL instance
   -- Copy the connection string from Settings → Database
   ```

3. **Update Environment Variables**
   ```env
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### **Option B: Railway**

1. **Create Railway Project**
   ```bash
   # Go to https://railway.app
   # Create new project
   # Add PostgreSQL service
   ```

### **Step 5: Run Database Migrations**

```bash
# Using Vercel CLI locally
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

---

## 🔄 **Phase 3: Redis Setup (Upstash)**

### **Step 1: Create Upstash Account**

1. **Sign up at https://upstash.com**
2. **Create Redis Database**
   - Choose region close to your users
   - Select free tier for MVP
   - Note down REST URL and Token

### **Step 2: Configure Redis**

Add to Vercel environment variables:
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## 📧 **Phase 4: Email Configuration**

### **Gmail SMTP Setup**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**
   - Google Account → Security → App passwords
   - Generate password for "Mail"

3. **Add Environment Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

---

## 💳 **Phase 5: Payment Setup (Stripe)**

### **Stripe Configuration**

1. **Create Stripe Account** at https://stripe.com
2. **Get API Keys** from Dashboard → Developers → API keys
3. **Add Environment Variables**
   ```env
   # Example values - replace with your actual Stripe keys
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

   **⚠️ Security Warning**: Never commit real API keys to git. These are example values only. Always use environment variables or secure secret management for production keys.

4. **Configure Webhooks**
   - Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

---

## 🔧 **Phase 6: Monitoring Setup**

### **Sentry for Error Tracking**

1. **Create Sentry Account** at https://sentry.io
2. **Create Next.js Project**
3. **Add Environment Variable**
   ```env
   SENTRY_DSN=your-sentry-dsn
   ```

---

## ✅ **Deployment Checklist**

### **Before First Deploy**
- [ ] GitHub repository is up to date
- [ ] Environment variables template created
- [ ] Vercel configuration added
- [ ] Build scripts verified

### **After Each Deploy**
- [ ] Deployment successful in Vercel dashboard
- [ ] No critical errors in browser console
- [ ] Database connectivity verified
- [ ] Redis cache working
- [ ] Email system functional
- [ ] Payment system operational

### **Production Readiness**
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Custom domain configured (optional)
- [ ] Error monitoring active
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check build logs in Vercel dashboard
   # Fix TypeScript errors
   # Ensure all dependencies are in package.json
   ```

2. **Database Connection Issues**
   ```bash
   # Verify DATABASE_URL format
   # Check database server is accessible
   # Ensure migrations are deployed
   ```

3. **Environment Variable Issues**
   ```bash
   # Verify all required variables are set
   # Check for typos in variable names
   # Ensure proper escaping of special characters
   ```

---

## 📞 **Next Steps After Deployment**

1. **Domain Setup** - Configure custom domain
2. **Analytics** - Add Google Analytics
3. **SEO** - Submit sitemap to search engines
4. **Performance** - Monitor and optimize
5. **Security** - Security headers and audits

---

*Ready to deploy? Let's start with Phase 1! 🚀*
