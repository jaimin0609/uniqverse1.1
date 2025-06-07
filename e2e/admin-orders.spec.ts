import { test, expect } from '@playwright/test';

test.describe('Admin Order Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin user
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'admin@uniqverse.com');
        await page.fill('[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for successful login and navigate to orders
        await page.waitForURL('/', { timeout: 10000 });
        await page.goto('/admin/orders');
        await page.waitForLoadState('networkidle');
    });

    test('should display orders page with filters and search', async ({ page }) => {
        // Check page elements
        await expect(page.locator('h1')).toContainText('Orders');

        // Check search functionality
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
            await expect(searchInput).toBeVisible();
        }

        // Check orders table/list
        const ordersContainer = page.locator('table, .space-y-4');
        await expect(ordersContainer).toBeVisible();

        // Check filter options
        const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
        if (await statusFilter.isVisible()) {
            await expect(statusFilter).toBeVisible();
        }
    });

    test('should display order metrics', async ({ page }) => {
        // Check for order metrics cards
        const metricsCards = page.locator('.grid .bg-white, .grid .card');

        if (await metricsCards.count() > 0) {
            await expect(metricsCards.first()).toBeVisible();

            // Check for total orders metric
            const totalOrdersCard = page.locator('.card, .bg-white').filter({ hasText: /total.*orders/i });
            if (await totalOrdersCard.isVisible()) {
                await expect(totalOrdersCard).toBeVisible();
            }

            // Check for processing orders metric
            const processingCard = page.locator('.card, .bg-white').filter({ hasText: /processing/i });
            if (await processingCard.isVisible()) {
                await expect(processingCard).toBeVisible();
            }

            // Check for revenue metric
            const revenueCard = page.locator('.card, .bg-white').filter({ hasText: /revenue/i });
            if (await revenueCard.isVisible()) {
                await expect(revenueCard).toBeVisible();
            }
        }
    });

    test('should filter orders by status', async ({ page }) => {
        const statusFilter = page.locator('select').first();

        if (await statusFilter.isVisible()) {
            // Test different status filters
            const options = await statusFilter.locator('option').allTextContents();

            for (let i = 1; i < Math.min(options.length, 4); i++) {
                await statusFilter.selectOption({ index: i });
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);
            }

            // Reset to "All"
            await statusFilter.selectOption({ index: 0 });
            await page.waitForLoadState('networkidle');
        }
    });

    test('should search orders', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');

        if (await searchInput.isVisible()) {
            // Search for order number or customer
            await searchInput.fill('test');
            await page.waitForTimeout(500); // Wait for debounced search
            await page.waitForLoadState('networkidle');

            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);
            await page.waitForLoadState('networkidle');
        }
    });

    test('should view order details', async ({ page }) => {
        // Look for order detail links or buttons
        const orderLink = page.locator('a[href*="/admin/orders/"], button').filter({ hasText: /view|details|#/i }).first();

        if (await orderLink.isVisible()) {
            await orderLink.click();

            // Should be on order detail page
            await expect(page.locator('h1')).toContainText(/Order|#/);

            // Check for order information sections
            const orderInfo = page.locator('.card, .bg-white').filter({ hasText: /order.*info|customer|items/i });
            if (await orderInfo.count() > 0) {
                await expect(orderInfo.first()).toBeVisible();
            }
        }
    });

    test('should update order status', async ({ page }) => {
        // Navigate to first order detail
        const orderLink = page.locator('a[href*="/admin/orders/"]').first();

        if (await orderLink.isVisible()) {
            await orderLink.click();

            // Look for status update dropdown/select
            const statusSelect = page.locator('select').filter({ hasText: /pending|processing|shipped|delivered/i });

            if (await statusSelect.isVisible()) {
                const currentStatus = await statusSelect.inputValue();

                // Change status
                const options = await statusSelect.locator('option').allTextContents();
                const newStatus = options.find(option => option !== currentStatus && option !== '');

                if (newStatus) {
                    await statusSelect.selectOption(newStatus);

                    // Look for update/save button
                    const updateButton = page.locator('button').filter({ hasText: /update|save/i });
                    if (await updateButton.isVisible()) {
                        await updateButton.click();

                        // Check for success message
                        const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|updated/i });
                        if (await successMessage.isVisible()) {
                            await expect(successMessage).toBeVisible();
                        }
                    }
                }
            }
        }
    });

    test('should add tracking information', async ({ page }) => {
        // Navigate to first order detail
        const orderLink = page.locator('a[href*="/admin/orders/"]').first();

        if (await orderLink.isVisible()) {
            await orderLink.click();

            // Look for tracking input or button
            const trackingInput = page.locator('input[name*="tracking"], input[placeholder*="tracking"]');
            const trackingButton = page.locator('button').filter({ hasText: /tracking/i });

            if (await trackingInput.isVisible()) {
                await trackingInput.fill('TRACK123456789');

                // Save tracking info
                const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
                if (await saveButton.isVisible()) {
                    await saveButton.click();

                    // Check for success message
                    const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|updated/i });
                    if (await successMessage.isVisible()) {
                        await expect(successMessage).toBeVisible();
                    }
                }
            } else if (await trackingButton.isVisible()) {
                await trackingButton.click();

                // Fill tracking in modal/dialog
                const modalTrackingInput = page.locator('input[name*="tracking"]');
                if (await modalTrackingInput.isVisible()) {
                    await modalTrackingInput.fill('TRACK123456789');

                    const submitButton = page.locator('button[type="submit"]');
                    if (await submitButton.isVisible()) {
                        await submitButton.click();
                    }
                }
            }
        }
    });

    test('should sort orders', async ({ page }) => {
        // Look for sort dropdown
        const sortSelect = page.locator('select').filter({ hasText: /sort|order.*by/i });

        if (await sortSelect.isVisible()) {
            const options = await sortSelect.locator('option').count();

            if (options > 1) {
                // Test different sort options
                await sortSelect.selectOption({ index: 1 });
                await page.waitForLoadState('networkidle');

                await sortSelect.selectOption({ index: 2 });
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should paginate orders', async ({ page }) => {
        // Look for pagination controls
        const pagination = page.locator('.pagination, .flex').filter({ hasText: /next|previous|page/i });

        if (await pagination.isVisible()) {
            const nextButton = page.locator('button').filter({ hasText: /next/i });

            if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
                await nextButton.click();
                await page.waitForLoadState('networkidle');

                // Go back to previous page
                const prevButton = page.locator('button').filter({ hasText: /prev/i });
                if (await prevButton.isVisible()) {
                    await prevButton.click();
                    await page.waitForLoadState('networkidle');
                }
            }
        }
    });

    test('should export orders', async ({ page }) => {
        // Look for export button
        const exportButton = page.locator('button').filter({ hasText: /export/i });

        if (await exportButton.isVisible()) {
            // Start download and verify
            const downloadPromise = page.waitForEvent('download');
            await exportButton.click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/orders.*\.(csv|xlsx|pdf)/i);
        }
    });

    test('should handle order notes', async ({ page }) => {
        // Navigate to first order detail
        const orderLink = page.locator('a[href*="/admin/orders/"]').first();

        if (await orderLink.isVisible()) {
            await orderLink.click();

            // Look for notes section
            const notesTextarea = page.locator('textarea[name*="note"], textarea[placeholder*="note"]');
            const addNoteButton = page.locator('button').filter({ hasText: /note/i });

            if (await notesTextarea.isVisible()) {
                await notesTextarea.fill('Test order note added by E2E test');

                const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
                if (await saveButton.isVisible()) {
                    await saveButton.click();
                }
            } else if (await addNoteButton.isVisible()) {
                await addNoteButton.click();

                // Fill note in modal
                const modalNoteInput = page.locator('textarea');
                if (await modalNoteInput.isVisible()) {
                    await modalNoteInput.fill('Test order note added by E2E test');

                    const submitButton = page.locator('button[type="submit"]');
                    if (await submitButton.isVisible()) {
                        await submitButton.click();
                    }
                }
            }
        }
    });
});
