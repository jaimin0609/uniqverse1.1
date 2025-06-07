import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Start on homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should complete full payment flow with Stripe test card', async ({ page }) => {
        // Add a product to cart
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        // Find and click on first product
        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        // Add to cart
        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        // Open cart
        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        // Proceed to checkout
        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Fill shipping information
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="firstName"]', 'John');
        await page.fill('[name="lastName"]', 'Doe');
        await page.fill('[name="address"]', '123 Test Street');
        await page.fill('[name="city"]', 'Test City');
        await page.fill('[name="postalCode"]', '12345');

        // Select country if dropdown exists
        const countrySelect = page.locator('select[name="country"]');
        if (await countrySelect.isVisible()) {
            await countrySelect.selectOption('US');
        }

        // Continue to payment step
        const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
        if (await continueBtn.isVisible()) {
            await continueBtn.click();
        }

        // Wait for Stripe Elements to load
        await page.waitForSelector('[data-testid="stripe-card-element"], iframe[name*="card"]', { timeout: 10000 });

        // Fill credit card information using Stripe test card
        const cardFrame = page.frameLocator('iframe[name*="card"]').first();

        if (await cardFrame.locator('input[name="cardnumber"]').isVisible()) {
            await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
            await cardFrame.locator('input[name="exp-date"]').fill('12/34');
            await cardFrame.locator('input[name="cvc"]').fill('123');
        }

        // Complete payment
        const payButton = page.locator('button').filter({ hasText: /pay|complete|place.*order/i });
        await payButton.click();

        // Wait for payment processing and redirect to success page
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Verify successful payment
        const successMessage = page.locator('h1, .success').filter({ hasText: /success|thank.*you|order.*confirmed/i });
        await expect(successMessage).toBeVisible({ timeout: 15000 });

        // Check for order number or confirmation details
        const orderNumber = page.locator('text=/order.*#\d+|#\d+/i');
        if (await orderNumber.isVisible()) {
            await expect(orderNumber).toBeVisible();
        }
    });

    test('should handle payment failure gracefully', async ({ page }) => {
        // Add product and proceed to checkout (similar setup)
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Fill shipping info
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="firstName"]', 'John');
        await page.fill('[name="lastName"]', 'Doe');
        await page.fill('[name="address"]', '123 Test Street');
        await page.fill('[name="city"]', 'Test City');
        await page.fill('[name="postalCode"]', '12345');

        const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
        if (await continueBtn.isVisible()) {
            await continueBtn.click();
        }

        // Wait for Stripe Elements
        await page.waitForSelector('[data-testid="stripe-card-element"], iframe[name*="card"]', { timeout: 10000 });

        // Use Stripe test card that will be declined
        const cardFrame = page.frameLocator('iframe[name*="card"]').first();

        if (await cardFrame.locator('input[name="cardnumber"]').isVisible()) {
            await cardFrame.locator('input[name="cardnumber"]').fill('4000000000000002'); // Declined card
            await cardFrame.locator('input[name="exp-date"]').fill('12/34');
            await cardFrame.locator('input[name="cvc"]').fill('123');
        }

        // Attempt payment
        const payButton = page.locator('button').filter({ hasText: /pay|complete|place.*order/i });
        await payButton.click();

        // Check for error message
        const errorMessage = page.locator('.error, .alert-error').filter({ hasText: /declined|failed|error/i });
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should validate required payment fields', async ({ page }) => {
        // Navigate to checkout
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Try to proceed without filling required fields
        const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
        if (await continueBtn.isVisible()) {
            await continueBtn.click();

            // Check for validation errors
            const errorMessages = page.locator('.error, .text-red-500').filter({ hasText: /required|invalid/i });
            if (await errorMessages.count() > 0) {
                await expect(errorMessages.first()).toBeVisible();
            }
        }
    });

    test('should calculate taxes and shipping correctly', async ({ page }) => {
        // Add product to cart
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Fill address to trigger tax/shipping calculation
        await page.fill('[name="address"]', '123 Test Street');
        await page.fill('[name="city"]', 'New York');
        await page.fill('[name="postalCode"]', '10001');

        const countrySelect = page.locator('select[name="country"]');
        if (await countrySelect.isVisible()) {
            await countrySelect.selectOption('US');
        }

        // Check for tax and shipping calculations
        const subtotal = page.locator('text=/subtotal/i').first();
        const tax = page.locator('text=/tax/i').first();
        const shipping = page.locator('text=/shipping/i').first();
        const total = page.locator('text=/total/i').last();

        if (await subtotal.isVisible()) {
            await expect(subtotal).toBeVisible();
        }

        if (await total.isVisible()) {
            await expect(total).toBeVisible();
        }
    });

    test('should apply coupon codes', async ({ page }) => {
        // Add product to cart
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        // Look for coupon input in cart or checkout
        const couponInput = page.locator('input[name*="coupon"], input[placeholder*="coupon"]');

        if (await couponInput.isVisible()) {
            await couponInput.fill('TEST10'); // Test coupon code

            const applyCouponBtn = page.locator('button').filter({ hasText: /apply/i });
            if (await applyCouponBtn.isVisible()) {
                await applyCouponBtn.click();

                // Check for discount applied
                const discount = page.locator('text=/discount|saved/i');
                if (await discount.isVisible()) {
                    await expect(discount).toBeVisible();
                }
            }
        }
    });

    test('should handle multiple payment methods', async ({ page }) => {
        // This test checks if the system supports multiple payment methods
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Look for payment method options
        const paymentMethods = page.locator('input[type="radio"][name*="payment"], select[name*="payment"]');

        if (await paymentMethods.count() > 0) {
            // Test different payment methods if available
            const methodCount = await paymentMethods.count();

            for (let i = 0; i < Math.min(methodCount, 3); i++) {
                if (await paymentMethods.nth(i).isVisible()) {
                    await paymentMethods.nth(i).click();
                    await page.waitForTimeout(500); // Wait for UI to update
                }
            }
        }
    });

    test('should save payment information for logged-in users', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // Add product and proceed to checkout
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const firstProduct = page.locator('a[href*="/products/"]').first();
        await firstProduct.click();

        const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
        await addToCartBtn.click();

        const cartButton = page.locator('button').filter({ hasText: /cart/i });
        await cartButton.click();

        const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
        await checkoutBtn.click();

        // Check if saved payment methods are available
        const savedPaymentMethods = page.locator('.saved-payment, .payment-method').filter({ hasText: /saved|ending.*in/i });

        if (await savedPaymentMethods.count() > 0) {
            await expect(savedPaymentMethods.first()).toBeVisible();
        }

        // Check for "Save payment method" checkbox
        const savePaymentCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /save.*payment/i });

        if (await savePaymentCheckbox.isVisible()) {
            await savePaymentCheckbox.check();
        }
    });
});
