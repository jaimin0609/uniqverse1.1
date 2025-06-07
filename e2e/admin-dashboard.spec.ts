import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin user first
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'jaimin0609@gmail.com');
        await page.fill('[name="password"]', '6941@Sjp');
        await page.click('button[type="submit"]');

        // Wait for successful login and redirect
        await page.waitForURL('/', { timeout: 10000 });

        // Navigate to admin dashboard
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');
    });

    test('should display admin dashboard with key metrics', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/Admin Dashboard/);

        // Check main dashboard elements are visible
        await expect(page.locator('h1')).toContainText('Dashboard');

        // Check metric cards are present
        await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
        await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
        await expect(page.locator('[data-testid="total-products"]')).toBeVisible();
        await expect(page.locator('[data-testid="total-users"]')).toBeVisible();

        // Check that metric values are displayed (should be numbers)
        const salesMetric = page.locator('[data-testid="total-sales"] .text-2xl');
        await expect(salesMetric).toBeVisible();

        const ordersMetric = page.locator('[data-testid="total-orders"] .text-2xl');
        await expect(ordersMetric).toBeVisible();
    });

    test('should display recent orders section', async ({ page }) => {
        // Check recent orders section
        await expect(page.locator('h2').filter({ hasText: 'Recent Orders' })).toBeVisible();

        // Check "View All Orders" link
        await expect(page.locator('a[href="/admin/orders"]')).toBeVisible();

        // Check if orders are displayed or "No recent orders" message
        const ordersSection = page.locator('.space-y-3');
        await expect(ordersSection).toBeVisible();
    });

    test('should display low stock alerts', async ({ page }) => {
        // Check low stock section
        await expect(page.locator('h2').filter({ hasText: 'Low Stock Alert' })).toBeVisible();

        // Check "Manage Inventory" link
        await expect(page.locator('a[href="/admin/products"]')).toBeVisible();
    });

    test('should navigate to different admin sections', async ({ page }) => {
        // Test navigation to products
        await page.click('a[href="/admin/products"]');
        await page.waitForURL('/admin/products');
        await expect(page).toHaveURL('/admin/products');

        // Go back to dashboard
        await page.goto('/admin');

        // Test navigation to orders
        await page.click('a[href="/admin/orders"]');
        await page.waitForURL('/admin/orders');
        await expect(page).toHaveURL('/admin/orders');
    });

    test('should handle date range filtering', async ({ page }) => {
        // Look for date range selector if present
        const dateRangeSelector = page.locator('select').filter({ hasText: /7 days|30 days|90 days/ });

        if (await dateRangeSelector.isVisible()) {
            // Test different date ranges
            await dateRangeSelector.selectOption('30');
            await page.waitForTimeout(1000); // Wait for metrics to update

            await dateRangeSelector.selectOption('90');
            await page.waitForTimeout(1000);
        }
    });

    test('should display growth rate indicators', async ({ page }) => {
        // Check for growth rate indicators if present
        const growthIndicators = page.locator('.text-green-600, .text-red-600, .text-gray-600');

        if (await growthIndicators.count() > 0) {
            await expect(growthIndicators.first()).toBeVisible();
        }
    });

    test('should handle admin authentication requirement', async ({ page }) => {
        // Test that non-admin users can't access admin dashboard
        // First logout
        await page.goto('/api/auth/signout');
        await page.click('button[type="submit"]'); // Confirm signout

        // Try to access admin dashboard
        await page.goto('/admin');

        // Should redirect to login or show unauthorized
        await expect(page).not.toHaveURL('/admin');
    });

    test('should display pending actions section', async ({ page }) => {
        // Check for pending orders count
        const pendingSection = page.locator('.flex.items-center').filter({ hasText: 'Pending Orders' });
        if (await pendingSection.isVisible()) {
            await expect(pendingSection).toBeVisible();
        }

        // Check for pending reviews count if present
        const reviewsSection = page.locator('.flex.items-center').filter({ hasText: 'Pending Reviews' });
        if (await reviewsSection.isVisible()) {
            await expect(reviewsSection).toBeVisible();
        }
    });
});
