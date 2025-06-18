import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

/**
 * Get the correct base URL for the current environment
 */
function getBaseUrl(): string {
  // Check for explicit environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // If in production (Vercel), use the production URL
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://uniqverse-v1.vercel.app';
  }

  // Default to localhost for development
  return 'http://localhost:3000';
}

/**
 * Configure the email transport
 */
export function getEmailTransporter() {
  // Check if email configuration is available
  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  if (!host || !port || !user || !pass) {
    console.warn('Email configuration incomplete. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: parseInt(port),
    secure: false, // Gmail SMTP with STARTTLS
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      // For Gmail SMTP
      rejectUnauthorized: false
    }
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const transporter = getEmailTransporter();    // Create the reset URL
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;// If no email config, log the reset URL to console
    if (!transporter) {
      console.log(`[DEV MODE] Password reset link for ${email}:`);
      console.log(resetUrl);
      return;
    }

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: email,
      subject: 'Reset Your Uniqverse Password',
      text: `
        Hello,
        
        You requested to reset your password on Uniqverse.
        
        Please click the link below to reset your password:
        ${resetUrl}
        
        This link is valid for 24 hours.
        
        If you didn't request this, please ignore this email.
        
        Thanks,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #6366f1, #3b82f6); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Uniqverse Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password on Uniqverse.</p>
              <p>Please click the button below to reset your password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </p>
              <p>This link is valid for 24 hours.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Thanks,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Send an order confirmation email
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // Get order details with customer and items information
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  take: 1,
                  select: { url: true }
                }
              }
            },
            variant: {
              select: {
                name: true,
                options: true
              }
            }
          }
        },
        shippingAddress: true
      }
    });

    if (!order || !order.user?.email) {
      console.error(`Order ${orderId} not found or customer email missing`);
      return;
    } const transporter = getEmailTransporter();    // If no email config, log the email content instead of sending
    if (!transporter) {
      console.log(`[DEV MODE] Order confirmation email for ${order.user.email}:`);
      console.log(`Order #${order.orderNumber} - Total: $${order.total.toFixed(2)}`);
      return;
    }

    // Format order items for email
    const itemsList = order.items.map(item => {
      const variantInfo = item.variant ?
        ` (${JSON.parse(item.variant.options || '{}').size || item.variant.name || ''})` : '';
      return `• ${item.product.name}${variantInfo} - Qty: ${item.quantity} - $${item.price.toFixed(2)}`;
    }).join('\n');

    const baseUrl = getBaseUrl();
    const orderUrl = `${baseUrl}/account/orders/${order.id}`;

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: order.user.email,
      subject: `Order Confirmation - #${order.orderNumber}`,
      text: `
        Hi ${order.user.name || 'there'},
        
        Thank you for your order! We've received your order and will process it shortly.
        
        Order Details:
        Order Number: #${order.orderNumber}
        Total: $${order.total.toFixed(2)}
        
        Items Ordered:
        ${itemsList}
        
        You can track your order status at: ${orderUrl}
        
        Thanks for shopping with Uniqverse!
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #6366f1, #3b82f6); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
            .order-summary { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .items-list { margin: 15px 0; }
            .item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Hi ${order.user.name || 'there'},</p>
              <p>Thank you for your order! We've received your order and will process it shortly.</p>
              
              <div class="order-summary">
                <h3>Order #${order.orderNumber}</h3>
                <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div class="items-list">
                <h4>Items Ordered:</h4>
                ${order.items.map(item => `
                  <div class="item">
                    ${item.product.name}${item.variant ? ` (${JSON.parse(item.variant.options || '{}').size || item.variant.name || ''})` : ''} 
                    - Qty: ${item.quantity} - $${item.price.toFixed(2)}
                  </div>
                `).join('')}
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" class="button">Track Your Order</a>
              </p>
              
              <p>Thanks for shopping with Uniqverse!</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Order confirmation email sent to ${order.user.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error('Failed to send order confirmation email');
  }
}

/**
 * Send a payment failure notification email
 */
export async function sendPaymentFailureEmail(orderId: string, errorMessage?: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order || !order.user?.email) {
      console.error(`Order ${orderId} not found or customer email missing`);
      return;
    } const transporter = getEmailTransporter(); if (!transporter) {
      console.log(`[DEV MODE] Payment failure email for ${order.user.email}:`);
      console.log(`Order #${order.orderNumber} - Payment failed: ${errorMessage || 'Unknown error'}`);
      return;
    }

    const baseUrl = getBaseUrl();
    const orderUrl = `${baseUrl}/account/orders/${order.id}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: order.user.email,
      subject: `Payment Failed - Order #${order.orderNumber}`,
      text: `
        Hi ${order.user.name || 'there'},
        
        We were unable to process the payment for your order #${order.orderNumber}.
        
        ${errorMessage ? `Error: ${errorMessage}` : 'Please check your payment method and try again.'}
        
        Order Total: $${order.total.toFixed(2)}
        
        You can retry your payment at: ${orderUrl}
        
        If you continue to experience issues, please contact our support team.
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #ef4444, #dc2626); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
            .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <p>Hi ${order.user.name || 'there'},</p>
              <p>We were unable to process the payment for your order #${order.orderNumber}.</p>
              
              ${errorMessage ? `
                <div class="error-box">
                  <strong>Error Details:</strong> ${errorMessage}
                </div>
              ` : ''}
              
              <p><strong>Order Total: $${order.total.toFixed(2)}</strong></p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" class="button">Retry Payment</a>
              </p>
              
              <p>If you continue to experience issues, please contact our support team.</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Payment failure email sent to ${order.user.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending payment failure email:', error);
    throw new Error('Failed to send payment failure email');
  }
}

/**
 * Send a payment cancellation notification email
 */
export async function sendPaymentCancellationEmail(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order || !order.user?.email) {
      console.error(`Order ${orderId} not found or customer email missing`);
      return;
    } const transporter = getEmailTransporter(); if (!transporter) {
      console.log(`[DEV MODE] Payment cancellation email for ${order.user.email}:`);
      console.log(`Order #${order.orderNumber} - Payment cancelled`);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: order.user.email,
      subject: `Order Cancelled - #${order.orderNumber}`,
      text: `
        Hi ${order.user.name || 'there'},
        
        Your order #${order.orderNumber} has been cancelled due to payment cancellation.
        
        Order Total: $${order.total.toFixed(2)}
        Cancellation Date: ${new Date().toLocaleDateString()}
        
        Any inventory that was reserved for this order has been restored.
        
        If you'd like to place a new order, you can visit our website anytime.
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #f59e0b, #d97706); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
            .info-box { background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${order.user.name || 'there'},</p>
              <p>Your order #${order.orderNumber} has been cancelled due to payment cancellation.</p>
              
              <div class="info-box">
                <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Any inventory that was reserved for this order has been restored.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${getBaseUrl()}" class="button">Shop Again</a>
              </p>
              
              <p>If you'd like to place a new order, you can visit our website anytime.</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Payment cancellation email sent to ${order.user.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending payment cancellation email:', error);
    throw new Error('Failed to send payment cancellation email');
  }
}

/**
 * Send a refund notification email
 */
export async function sendRefundNotificationEmail(orderId: string, isFullRefund: boolean, amount: number) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order || !order.user?.email) {
      console.error(`Order ${orderId} not found or customer email missing`);
      return;
    } const transporter = getEmailTransporter();
    const refundType = isFullRefund ? 'Full Refund' : 'Partial Refund'; if (!transporter) {
      console.log(`[DEV MODE] Refund notification email for ${order.user.email}:`);
      console.log(`Order #${order.orderNumber} - ${refundType}: $${amount.toFixed(2)}`);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: order.user.email,
      subject: `${refundType} Processed - Order #${order.orderNumber}`,
      text: `
        Hi ${order.user.name || 'there'},
        
        We've processed a ${refundType.toLowerCase()} for your order #${order.orderNumber}.
        
        Refund Details:
        - Refund Amount: $${amount.toFixed(2)}
        - Original Order Total: $${order.total.toFixed(2)}
        - Refund Type: ${refundType}
        - Processing Date: ${new Date().toLocaleDateString()}
        
        Your refund will appear on your original payment method within 3-5 business days.
        
        ${isFullRefund ? 'Any inventory from this order has been restored to our system.' : ''}
        
        If you have any questions about this refund, please contact our support team.
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #10b981, #059669); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .refund-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${refundType} Processed</h1>
            </div>
            <div class="content">
              <p>Hi ${order.user.name || 'there'},</p>
              <p>We've processed a ${refundType.toLowerCase()} for your order #${order.orderNumber}.</p>
              
              <div class="refund-box">
                <h4>Refund Details:</h4>
                <p><strong>Refund Amount:</strong> $${amount.toFixed(2)}</p>
                <p><strong>Original Order Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Refund Type:</strong> ${refundType}</p>
                <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your refund will appear on your original payment method within 3-5 business days.</p>
              
              ${isFullRefund ? '<p>Any inventory from this order has been restored to our system.</p>' : ''}
              
              <p>If you have any questions about this refund, please contact our support team.</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`${refundType} notification email sent to ${order.user.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending refund notification email:', error);
    throw new Error('Failed to send refund notification email');
  }
}

/**
 * Send an action required email for payment completion
 */
export async function sendActionRequiredEmail(orderId: string, actionType?: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order || !order.user?.email) {
      console.error(`Order ${orderId} not found or customer email missing`);
      return;
    } const transporter = getEmailTransporter();
    const action = actionType || 'additional verification'; if (!transporter) {
      console.log(`[DEV MODE] Action required email for ${order.user.email}:`);
      console.log(`Order #${order.orderNumber} - Action required: ${action}`);
      return;
    }

    const baseUrl = getBaseUrl();
    const orderUrl = `${baseUrl}/account/orders/${order.id}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: order.user.email,
      subject: `Action Required - Order #${order.orderNumber}`,
      text: `
        Hi ${order.user.name || 'there'},
        
        Your order #${order.orderNumber} requires additional action to complete the payment.
        
        Action Required: ${action}
        Order Total: $${order.total.toFixed(2)}
        
        Please complete the required action at: ${orderUrl}
        
        If you don't complete this action within 24 hours, your order may be cancelled automatically.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #f59e0b, #d97706); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 4px; }
            .urgent-box { background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Action Required</h1>
            </div>
            <div class="content">
              <p>Hi ${order.user.name || 'there'},</p>
              <p>Your order #${order.orderNumber} requires additional action to complete the payment.</p>
              
              <div class="urgent-box">
                <p><strong>Action Required:</strong> ${action}</p>
                <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" class="button">Complete Action</a>
              </p>
              
              <p><strong>Important:</strong> If you don't complete this action within 24 hours, your order may be cancelled automatically.</p>
              
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Action required email sent to ${order.user.email} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error sending action required email:', error);
    throw new Error('Failed to send action required email');
  }
}

/**
 * Send a newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(email: string, unsubscribeToken: string) {
  try {
    const transporter = getEmailTransporter();

    // Create the unsubscribe URL
    const baseUrl = getBaseUrl();
    const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`;    // If no email config, log to console
    if (!transporter) {
      console.log(`[DEV MODE] Newsletter welcome email for ${email}:`);
      console.log(`Unsubscribe URL: ${unsubscribeUrl}`);
      return;
    }

    const mailOptions = {
      from: `"Uniqverse" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Welcome to Uniqverse Newsletter!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Uniqverse Newsletter</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 40px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 14px;
              color: #64748b;
            }
            .unsubscribe {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Uniqverse!</h1>
            <p>Thank you for subscribing to our newsletter</p>
          </div>
          
          <div class="content">
            <h2>🎉 You're all set!</h2>
            <p>Hi there!</p>
            
            <p>Welcome to the Uniqverse community! We're thrilled to have you on board.</p>
            
            <p>Here's what you can expect from our newsletter:</p>
            <ul>
              <li>🆕 <strong>New Product Launches</strong> - Be the first to know about our latest products</li>
              <li>💰 <strong>Exclusive Deals</strong> - Special discounts just for our subscribers</li>
              <li>📚 <strong>Product Tips</strong> - Get the most out of your purchases</li>
              <li>🎯 <strong>Personalized Recommendations</strong> - Curated products based on your interests</li>
            </ul>
            
            <p>We promise to keep our emails valuable and not spam your inbox. You'll typically hear from us 1-2 times per week with our best content and offers.</p>
            
            <a href="${baseUrl}" class="button">Start Shopping</a>
            
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:support@uniqverse.com">support@uniqverse.com</a></p>
              <p>Follow us on social media for daily updates and inspiration!</p>
            </div>
            
            <div class="unsubscribe">
              <p>You can <a href="${unsubscribeUrl}">unsubscribe</a> at any time if you no longer wish to receive our emails.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Newsletter welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending newsletter welcome email:', error);
    // Don't throw error to prevent subscription failure
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const transporter = getEmailTransporter();

    const baseUrl = getBaseUrl();    // If no email config, log to console
    if (!transporter) {
      console.log(`[DEV MODE] Welcome email for ${email} (${name}):`);
      console.log(`Welcome to Uniqverse!`);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: email,
      subject: 'Welcome to Uniqverse! 🎉',
      text: `
        Hi ${name},
        
        Welcome to Uniqverse! We're thrilled to have you join our community.
        
        Your account has been successfully created and you can now:
        • Browse our unique product collection
        • Save items to your wishlist
        • Track your orders and purchase history
        • Get exclusive member offers
        
        Ready to start shopping? Visit us at: ${baseUrl}
        
        If you have any questions, our support team is here to help at support@uniqverse.com
        
        Welcome aboard!
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #6366f1, #3b82f6); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .header p { color: #e0e7ff; margin: 10px 0 0 0; }
            .content { padding: 30px 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: white; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .features { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .feature { margin: 10px 0; }
            .emoji { font-size: 18px; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Uniqverse! 🎉</h1>
              <p>Your journey to unique products starts here</p>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Welcome to Uniqverse! We're thrilled to have you join our community of unique product enthusiasts.</p>
              
              <div class="features">
                <h3>Your account is ready! Here's what you can do:</h3>
                <div class="feature"><span class="emoji">🛍️</span> Browse our curated collection of unique products</div>
                <div class="feature"><span class="emoji">❤️</span> Save items to your wishlist for later</div>
                <div class="feature"><span class="emoji">📦</span> Track your orders and view purchase history</div>
                <div class="feature"><span class="emoji">🎁</span> Get exclusive member offers and early access</div>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}" class="button">Start Shopping</a>
              </p>
              
              <p>If you have any questions, our support team is here to help at <a href="mailto:support@uniqverse.com">support@uniqverse.com</a></p>
              
              <p>Welcome aboard!<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to prevent registration failure
  }
}

/**
 * Send an unsubscribe confirmation email
 */
export async function sendUnsubscribeConfirmationEmail(email: string) {
  try {
    const transporter = getEmailTransporter();

    const baseUrl = getBaseUrl();
    const subscribeUrl = `${baseUrl}/api/newsletter/subscribe`;    // If no email config, log to console
    if (!transporter) {
      console.log(`[DEV MODE] Unsubscribe confirmation email for ${email}:`);
      console.log(`You have been unsubscribed from our newsletter`);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Uniqverse" <no-reply@uniqverse.com>',
      to: email,
      subject: 'You\'ve been unsubscribed from Uniqverse Newsletter',
      text: `
        Hi there,
        
        You have been successfully unsubscribed from the Uniqverse newsletter.
        
        We're sorry to see you go! You will no longer receive marketing emails from us.
        
        If you unsubscribed by mistake or change your mind later, you can always resubscribe at: ${baseUrl}
        
        You may still receive important transactional emails related to your account and orders.
        
        Thank you for being part of our community.
        
        Best regards,
        The Uniqverse Team
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #64748b, #475569); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; }
            .content { padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: white; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
            .info-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Unsubscribed Successfully</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You have been successfully unsubscribed from the Uniqverse newsletter.</p>
              
              <div class="info-box">
                <p><strong>What this means:</strong></p>
                <p>• You will no longer receive marketing emails from us</p>
                <p>• You may still receive important transactional emails related to your account and orders</p>
                <p>• You can resubscribe anytime if you change your mind</p>
              </div>
              
              <p>We're sorry to see you go! If you unsubscribed by mistake or change your mind later, you can always resubscribe on our website.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}" class="button">Visit Our Website</a>
              </p>
              
              <p>Thank you for being part of our community.</p>
              <p>Best regards,<br>The Uniqverse Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Unsubscribe confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending unsubscribe confirmation email:', error);
    // Don't throw error to prevent unsubscribe failure
  }
}

/**
 * Send an email verification email to new users
 */
export async function sendEmailVerificationEmail(email: string, token: string, name?: string) {
  try {
    const transporter = getEmailTransporter();

    // Create the verification URL
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // If no email config, log the verification URL to console
    if (!transporter) {
      console.log(`[DEV MODE] Email verification link for ${email}:`);
      console.log(verificationUrl);
      return;
    }

    // Send the verification email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@uniqverse.com',
      to: email,
      subject: 'Verify Your UniQVerse Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - UniQVerse</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; background-color: #ffffff; }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .divider { height: 1px; background-color: #eee; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to UniQVerse!</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${name || 'there'}!</h2>
              
              <p>Thank you for joining UniQVerse! We're excited to have you as part of our community of unique individuals.</p>
              
              <p>To complete your registration and start exploring our exclusive products, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="divider"></div>
              
              <p><strong>Why verify your email?</strong></p>
              <ul>
                <li>✅ Secure your account</li>
                <li>✅ Receive order confirmations</li>
                <li>✅ Get exclusive offers and updates</li>
                <li>✅ Enable password recovery</li>
              </ul>
              
              <div class="divider"></div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <p style="color: #999; font-size: 14px;">
                <strong>Note:</strong> This verification link will expire in 24 hours for security reasons. 
                If you didn't create an account with us, you can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 UniQVerse. All rights reserved.</p>
              <p>Need help? Contact us at support@uniqverse.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`Email verification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email verification:', error);
    throw error; // Re-throw to handle in calling function
  }
}
