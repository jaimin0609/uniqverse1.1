import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Use the latest stable API version
});

// Function to create a payment intent
export async function createPaymentIntent(amount: number, customerId?: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires the amount in cents
      currency: 'usd',
      customer: customerId, // Optional, only if the customer already exists in Stripe
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return { success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Function to retrieve a payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

// Function to create a Stripe customer
export async function createCustomer(email: string, name?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Function to verify a webhook signature
export function constructEventFromPayload(signature: string, payload: Buffer) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Missing Stripe webhook secret');
  }
  
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
}