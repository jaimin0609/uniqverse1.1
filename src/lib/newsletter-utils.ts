import { getEmailTransporter } from '@/lib/email-utils';
import { db } from '@/lib/db';

interface NewsletterCampaignOptions {
    subject: string;
    content: string;
    senderName?: string;
    senderEmail?: string;
    includeUnsubscribeLink?: boolean;
}

/**
 * Send newsletter campaign to all active subscribers
 */
export async function sendNewsletterCampaign(options: NewsletterCampaignOptions) {
    try {
        const {
            subject,
            content,
            senderName = 'Uniqverse',
            senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
            includeUnsubscribeLink = true,
        } = options;

        // Get all active subscribers
        const subscribers = await db.newsletterSubscription.findMany({
            where: { status: 'ACTIVE' },
            select: {
                email: true,
                unsubscribeToken: true,
            },
        });

        if (subscribers.length === 0) {
            return { success: false, message: 'No active subscribers found' };
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let sentCount = 0;
        let errorCount = 0;

        // Send emails in batches to avoid overwhelming the SMTP server
        const batchSize = 10;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);

            await Promise.all(
                batch.map(async (subscriber) => {
                    try {
                        let emailContent = content;

                        // Add unsubscribe link if requested
                        if (includeUnsubscribeLink && subscriber.unsubscribeToken) {
                            const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}&email=${encodeURIComponent(subscriber.email)}`;
                            emailContent += `
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                  <p>You received this email because you're subscribed to our newsletter.</p>
                  <p><a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a></p>
                </div>
              `;
                        } await sendNewsletterEmail({
                            to: subscriber.email,
                            subject,
                            html: generateNewsletterTemplate(emailContent, subject),
                            from: `"${senderName}" <${senderEmail}>`,
                        });

                        sentCount++;
                    } catch (error) {
                        console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
                        errorCount++;
                    }
                })
            );

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return {
            success: true,
            message: `Newsletter sent successfully. Sent: ${sentCount}, Errors: ${errorCount}`,
            sentCount,
            errorCount,
            totalSubscribers: subscribers.length,
        };
    } catch (error) {
        console.error('Newsletter campaign error:', error);
        return {
            success: false,
            message: 'Failed to send newsletter campaign',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate newsletter HTML template
 */
function generateNewsletterTemplate(content: string, subject: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .content h2 {
          color: #1f2937;
          margin-top: 0;
        }
        .button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #2563eb;
          text-decoration: none;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Uniqverse</h1>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="#" style="margin: 0 10px;">Facebook</a>
            <a href="#" style="margin: 0 10px;">Twitter</a>
            <a href="#" style="margin: 0 10px;">Instagram</a>
          </div>
          <p>© ${new Date().getFullYear()} Uniqverse. All rights reserved.</p>
          <p>Need help? Contact us at <a href="mailto:support@uniqverse.com">support@uniqverse.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send newsletter email utility function
 */
async function sendNewsletterEmail(options: {
    to: string;
    subject: string;
    html: string;
    from: string;
}) {
    const transporter = getEmailTransporter();

    if (!transporter) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV MODE] Newsletter email to ${options.to}:`);
            console.log(`Subject: ${options.subject}`);
            return;
        }
        throw new Error('Email transporter not configured');
    }

    await transporter.sendMail(options);
}
