# Gmail SMTP Setup Guide for Development

This guide will help you set up Gmail SMTP for your email notification system during development and testing.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the prompts to enable 2FA if not already enabled

## Step 2: Generate App Password

1. After enabling 2FA, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. Select "Other (custom name)" from the dropdown
4. Enter a name like "Uniqverse Email System"
5. Click "Generate"
6. **Copy the 16-character password** - you'll use this as your SMTP password - tkfp fbib uzwr sodh

## Step 3: Update Environment Variables

Add these configurations to your `.env.local` file:

```env
# Gmail SMTP Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-gmail@gmail.com
EMAIL_SERVER_PASSWORD=your-16-char-app-password
EMAIL_FROM="Uniqverse Support <your-gmail@gmail.com>"
```

## Step 4: Test Configuration

The system will automatically use these settings when sending emails in production mode.

## Development vs Production

- **Development Mode**: Emails are logged to console instead of being sent
- **Production Mode**: Emails are sent via Gmail SMTP

## Security Notes

- Never commit your app password to version control
- Use different Gmail accounts for development and production
- Consider using dedicated email services like SendGrid or Mailgun for production

## Troubleshooting

### Common Issues:

1. **"Invalid credentials"**
   - Ensure 2FA is enabled
   - Double-check the app password
   - Make sure you're using the app password, not your regular Gmail password

2. **"Less secure app access"**
   - This error shouldn't occur with app passwords
   - If it does, ensure you're using an app password, not regular password

3. **"Daily sending limit exceeded"**
   - Gmail has a daily limit of 500 emails for free accounts
   - For production, consider using dedicated email services

## Alternative Free Email Services

If you prefer not to use Gmail:

1. **Outlook/Hotmail SMTP**
   - Host: smtp-mail.outlook.com
   - Port: 587
   - Requires app password

2. **Yahoo SMTP**
   - Host: smtp.mail.yahoo.com
   - Port: 587
   - Requires app password

3. **Dedicated Services (Free Tiers)**
   - SendGrid: 100 emails/day free
   - Mailgun: 5,000 emails/month free
   - EmailJS: 200 emails/month free

## Production Recommendations

For production deployment, consider:
- Using a dedicated email service
- Setting up a custom domain for professional appearance
- Implementing email delivery tracking
- Adding unsubscribe functionality for marketing emails
