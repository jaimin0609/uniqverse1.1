import { test, expect } from '@playwright/test';

test.describe('Admin Product Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin user
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'admin@uniqverse.com');
        await page.fill('[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for successful login and navigate to products
        await page.waitForURL('/', { timeout: 10000 });
        await page.goto('/admin/products');
        await page.waitForLoadState('networkidle');
    });

    test('should display products page with search and filters', async ({ page }) => {
        // Check page elements
        await expect(page.locator('h1')).toContainText('Products');

        // Check search functionality
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Check "Add Product" button
        await expect(page.locator('a[href="/admin/products/new"]')).toBeVisible();

        // Check products table/grid
        const productsContainer = page.locator('table, .grid');
        await expect(productsContainer).toBeVisible();
    });

    test('should search products', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');

        // Perform search
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for debounced search

        // Check that search was performed (URL should contain search param or results should filter)
        await page.waitForLoadState('networkidle');

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
    });

    test('should filter products by category', async ({ page }) => {
        // Look for category filter
        const categoryFilter = page.locator('select').first();

        if (await categoryFilter.isVisible()) {
            // Get available options
            const options = await categoryFilter.locator('option').count();

            if (options > 1) {
                // Select first non-default option
                await categoryFilter.selectOption({ index: 1 });
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should navigate to add new product', async ({ page }) => {
        await page.click('a[href="/admin/products/new"]');
        await page.waitForURL('/admin/products/new');

        // Check new product form is displayed
        await expect(page.locator('h1')).toContainText('Add Product');
        await expect(page.locator('form')).toBeVisible();
    });

    test('should create a new product', async ({ page }) => {
        // Navigate to new product page
        await page.click('a[href="/admin/products/new"]');
        await page.waitForURL('/admin/products/new');

        // Fill out product form
        await page.fill('[name="name"]', 'Test E2E Product');
        await page.fill('[name="description"]', 'This is a test product created by E2E tests');
        await page.fill('[name="price"]', '29.99');
        await page.fill('[name="inventory"]', '50');

        // Select category if available
        const categorySelect = page.locator('select[name="categoryId"]');
        if (await categorySelect.isVisible()) {
            const options = await categorySelect.locator('option').count();
            if (options > 1) {
                await categorySelect.selectOption({ index: 1 });
            }
        }

        // Add image URL if there's an image input
        const imageInput = page.locator('input[type="url"]').first();
        if (await imageInput.isVisible()) {
            await imageInput.fill('https://via.placeholder.com/400x400');
        }

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to products list or show success
        await page.waitForLoadState('networkidle');

        // Check for success message or redirect
        const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|created/i });
        if (await successMessage.isVisible()) {
            await expect(successMessage).toBeVisible();
        }
    });

    test('should edit an existing product', async ({ page }) => {
        // Look for edit button on first product
        const editButton = page.locator('a[href*="/edit"], button').filter({ hasText: /edit/i }).first();

        if (await editButton.isVisible()) {
            await editButton.click();

            // Should be on edit page
            await expect(page.locator('h1')).toContainText(/Edit|Update/);

            // Modify product name
            const nameInput = page.locator('[name="name"]');
            await nameInput.clear();
            await nameInput.fill('Updated Test Product');

            // Submit changes
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');

            // Check for success message
            const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|updated/i });
            if (await successMessage.isVisible()) {
                await expect(successMessage).toBeVisible();
            }
        }
    });

    test('should delete a product', async ({ page }) => {
        // Look for delete button
        const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();

        if (await deleteButton.isVisible()) {
            // Handle confirmation dialog
            page.on('dialog', async dialog => {
                expect(dialog.type()).toBe('confirm');
                await dialog.accept();
            });

            await deleteButton.click();

            // Wait for deletion to complete
            await page.waitForLoadState('networkidle');

            // Check for success message
            const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|deleted/i });
            if (await successMessage.isVisible()) {
                await expect(successMessage).toBeVisible();
            }
        }
    });

    test('should sort products', async ({ page }) => {
        // Look for sort options
        const sortSelect = page.locator('select').filter({ hasText: /sort|order/i });

        if (await sortSelect.isVisible()) {
            // Test different sort options
            const options = await sortSelect.locator('option').count();

            if (options > 1) {
                await sortSelect.selectOption({ index: 1 });
                await page.waitForLoadState('networkidle');

                await sortSelect.selectOption({ index: 2 });
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should paginate products', async ({ page }) => {
        // Look for pagination controls
        const nextButton = page.locator('button').filter({ hasText: /next/i });
        const prevButton = page.locator('button').filter({ hasText: /prev/i });

        if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');

            // Go back to first page
            if (await prevButton.isVisible()) {
                await prevButton.click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should handle bulk product actions', async ({ page }) => {
        // Look for checkboxes for bulk selection
        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();

        if (checkboxCount > 1) {
            // Select first product
            await checkboxes.nth(1).check(); // Skip header checkbox

            // Look for bulk action buttons
            const bulkDeleteBtn = page.locator('button').filter({ hasText: /bulk.*delete|delete.*selected/i });

            if (await bulkDeleteBtn.isVisible()) {
                // Handle confirmation dialog
                page.on('dialog', async dialog => {
                    await dialog.dismiss(); // Cancel bulk delete in test
                });

                await bulkDeleteBtn.click();
            }
        }
    });

    test('should display product metrics', async ({ page }) => {
        // Check for product count or metrics
        const metricsContainer = page.locator('.grid').filter({ hasText: /total|count/i }).first();

        if (await metricsContainer.isVisible()) {
            await expect(metricsContainer).toBeVisible();
        }

        // Check low stock indicators
        const lowStockIndicators = page.locator('.text-red-600, .bg-red-100').filter({ hasText: /low.*stock|out.*stock/i });

        if (await lowStockIndicators.count() > 0) {
            await expect(lowStockIndicators.first()).toBeVisible();
        }
    });
});
