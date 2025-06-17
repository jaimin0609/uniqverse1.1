# 🚀 Uniqverse Production Services Setup Guide

## 📋 Required Services for Production

### 1. Database (Required)
**Options:**
- **Supabase** (Recommended) - Free tier: 500MB, 2 CPU hours
- **Railway** - $5/month for 512MB RAM
- **Neon** - Free tier: 3GB storage
- **PlanetScale** - Free tier: 5GB storage

**Setup Steps:**
1. Create account and database
2. Get connection string (postgresql://...)
3. Set as `DATABASE_URL` in Vercel

### 2. Redis Cache (Required)
**Upstash Redis** (Recommended)
- Free tier: 10K commands/day
- Setup: https://upstash.com/
- Get: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 3. Image Storage (Required)
**Cloudinary** (Recommended)
- Free tier: 25GB storage, 25GB bandwidth
- Setup: https://cloudinary.com/
- Get: Cloud name, API key, API secret

### 4. Payment Processing (Required)
**Stripe**
- Test mode (for staging): Free
- Live mode: 2.9% + 30¢ per transaction
- Setup: https://stripe.com/
- Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

### 5. Email Service (Optional)
**Options:**
- **Gmail SMTP** (Free for low volume)
- **SendGrid** (Free tier: 100 emails/day)
- **AWS SES** (Pay-as-you-go)

## 🔧 Quick Setup Commands

### Generate NextAuth Secret
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Set Individual Environment Variables
```bash
# Example commands (run these one by one)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
# ... etc
```

### List Current Environment Variables
```bash
vercel env ls
```

### Remove Environment Variable (if needed)
```bash
vercel env rm VARIABLE_NAME production
```

## 🎯 Critical Production URLs

After deployment, set these in your external services:

1. **Stripe Webhook URL**: `https://yourdomain.vercel.app/api/webhooks/stripe`
2. **NextAuth URL**: `https://yourdomain.vercel.app`
3. **Redirect URLs**: Update in Google/social login providers

## 📊 Post-Deployment Health Checks

- Health endpoint: `https://yourdomain.vercel.app/api/health`
- Metrics endpoint: `https://yourdomain.vercel.app/api/metrics`
- Admin login: `https://yourdomain.vercel.app/auth/login`

## 🚨 Common Issues

1. **Database Connection**: Ensure IP whitelist includes 0.0.0.0/0 for Vercel
2. **CORS Errors**: Check NEXTAUTH_URL matches exactly
3. **Stripe Webhooks**: Verify endpoint and secret match
4. **Redis Connection**: Verify Upstash credentials are correct
