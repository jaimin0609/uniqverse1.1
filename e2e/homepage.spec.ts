import { test, expect } from '@playwright/test';

test.describe('Homepage and Navigation', () => {
    test('should load homepage successfully', async ({ page }) => {
        await page.goto('/');

        // Check if the page title contains "UniQVerse"
        await expect(page).toHaveTitle(/UniQVerse/);        // Check for main navigation elements (account for mobile hidden nav)
        const nav = page.locator('nav');
        if (await page.viewportSize() && page.viewportSize()!.width < 768) {
            // On mobile, nav might be hidden - check for mobile menu instead
            await expect(page.locator('button:has(svg[class*="lucide-menu"])')).toBeVisible();
        } else {
            await expect(nav).toBeVisible();
        }

        // Check for hero section
        await expect(page.locator('h1')).toBeVisible();

        // Check for featured products section
        await expect(page.getByText(/featured/i)).toBeVisible();
    }); test('should navigate to shop page', async ({ page }) => {
        await page.goto('/');

        // Handle mobile navigation - open mobile menu first if needed
        const viewport = page.viewportSize();
        if (viewport && viewport.width < 768) {
            const mobileMenuButton = page.locator('button:has(svg[class*="lucide-menu"])');
            if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.click();
                await page.waitForTimeout(500);
            }
        }

        // Click on shop link in navigation - more specific selector
        const shopLink = page.locator('nav a[href="/shop"], a[href="/shop"]').first();
        await expect(shopLink).toBeVisible();
        await shopLink.click();

        // Verify we're on the shop page
        await expect(page).toHaveURL(/\/shop/);

        // Check for product listings or shop content
        await expect(page.locator('h1')).toBeVisible();
    }); test('should search for products', async ({ page }) => {
        await page.goto('/');

        // Click on search button to open search overlay - using svg with lucide class naming
        const searchButton = page.locator('button:has(svg[class*="lucide-search"])');
        await expect(searchButton).toBeVisible();
        await searchButton.click();

        // Look for search input in the overlay - more specific selectors
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]');
        await expect(searchInput).toBeVisible();

        // Search for a product
        await searchInput.fill('test');
        await searchInput.press('Enter');

        // Wait for search results or navigation
        await page.waitForLoadState('networkidle');

        // Verify we're on a search results page or have results
        await expect(page).toHaveURL(/search|shop/);
    }); test('should open and close cart drawer', async ({ page }) => {
        await page.goto('/');        // Click on cart button (ShoppingCart icon) - using more specific header selector
        const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
        await expect(cartButton).toBeVisible();
        await cartButton.click();

        // Verify cart drawer/modal opens - check for common cart drawer patterns
        await expect(page.locator('[role="dialog"], .cart-drawer, [data-testid="cart-drawer"]')).toBeVisible();

        // Close cart drawer by clicking outside or escape
        await page.keyboard.press('Escape');

        // Verify cart drawer closes
        await expect(page.locator('[role="dialog"], .cart-drawer, [data-testid="cart-drawer"]')).not.toBeVisible();
    });

    test('should navigate to different categories', async ({ page }) => {
        await page.goto('/');        // Check if categories navigation exists - target visible navigation
        const categoriesNav = page.locator('nav:visible, [data-testid="categories"]:visible');

        // For mobile, we might need to open the mobile menu first
        const mobileMenuButton = page.locator('button:has(svg.lucide-menu)');
        if (await mobileMenuButton.isVisible()) {
            await mobileMenuButton.click();
            await page.waitForTimeout(500); // Wait for menu to open
        }

        await expect(categoriesNav).toBeVisible();

        // Try to click on a category if available
        const categoryLink = page.locator('a[href*="/category"], a[href*="/shop"]').first();
        if (await categoryLink.isVisible()) {
            await categoryLink.click();

            // Verify navigation worked
            await expect(page).toHaveURL(/\/shop|\/category/);
        }
    }); test('should have responsive navigation on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Check for mobile navigation trigger (hamburger menu) - using more specific selector
        const mobileMenuTrigger = page.locator('button:has(svg[class*="lucide-menu"]), button[aria-label*="menu" i]');
        await expect(mobileMenuTrigger).toBeVisible();

        await mobileMenuTrigger.click();

        // Verify mobile menu opens (navigation links should be visible)
        // Wait for menu animation
        await page.waitForTimeout(500);

        // Check for navigation links or menu content
        const menuContent = page.locator('nav a[href="/shop"], a[href="/about"], [role="navigation"]');
        await expect(menuContent.first()).toBeVisible();
    });
});
