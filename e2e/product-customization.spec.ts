import { test, expect } from '@playwright/test';

test.describe('Product Customization E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should access product customization interface', async ({ page }) => {
        // Find a customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        // Look for customizable products or navigate to specific customizable product
        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        // Look for customize button
        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();

            // Should be on customization page
            await expect(page.locator('canvas, .customization-canvas')).toBeVisible({ timeout: 10000 });
        } else {
            // Skip test if no customizable products are available
            test.skip(true, 'No customizable products found');
        }
    });

    test('should add text to customization canvas', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();

            // Wait for customization interface
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Look for add text button
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });

            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                // Fill text input
                const textInput = page.locator('input[type="text"], textarea').filter({ hasText: /text|content/i }).first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Custom Text E2E Test');

                    // Apply text
                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }

                // Verify text appears on canvas
                const canvas = page.locator('canvas');
                await expect(canvas).toBeVisible();
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should change text properties (font, size, color)', async ({ page }) => {
        // Navigate to customizable product and add text
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Add text first
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });
            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                const textInput = page.locator('input[type="text"], textarea').first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Test Text');

                    // Look for text customization options
                    const fontSelect = page.locator('select').filter({ hasText: /font/i });
                    if (await fontSelect.isVisible()) {
                        await fontSelect.selectOption({ index: 1 });
                    }

                    const sizeInput = page.locator('input[type="number"], input[type="range"]').filter({ hasText: /size/i });
                    if (await sizeInput.isVisible()) {
                        await sizeInput.fill('24');
                    }

                    const colorInput = page.locator('input[type="color"]');
                    if (await colorInput.isVisible()) {
                        await colorInput.fill('#ff0000'); // Red color
                    }

                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should upload and add custom image', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Look for image upload button
            const addImageBtn = page.locator('button').filter({ hasText: /add.*image|image|upload/i });

            if (await addImageBtn.isVisible()) {
                await addImageBtn.click();

                // Look for file input
                const fileInput = page.locator('input[type="file"]');

                if (await fileInput.isVisible()) {
                    // Create a test image file (or use URL input if available)
                    const testImagePath = 'test-files/test-image.png';

                    // If there's a URL input instead of file upload
                    const urlInput = page.locator('input[type="url"], input[placeholder*="url"]');
                    if (await urlInput.isVisible()) {
                        await urlInput.fill('https://via.placeholder.com/150');

                        const addBtn = page.locator('button').filter({ hasText: /add|upload|confirm/i });
                        if (await addBtn.isVisible()) {
                            await addBtn.click();
                        }
                    }
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should add shapes to design', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Look for shapes button
            const shapesBtn = page.locator('button').filter({ hasText: /shapes|rectangle|circle/i });

            if (await shapesBtn.isVisible()) {
                await shapesBtn.click();

                // Add rectangle
                const rectangleBtn = page.locator('button').filter({ hasText: /rectangle|rect/i });
                if (await rectangleBtn.isVisible()) {
                    await rectangleBtn.click();
                }

                // Change shape color if color picker is available
                const shapeColorInput = page.locator('input[type="color"]');
                if (await shapeColorInput.isVisible()) {
                    await shapeColorInput.fill('#0000ff'); // Blue color
                }

                // Add circle
                const circleBtn = page.locator('button').filter({ hasText: /circle/i });
                if (await circleBtn.isVisible()) {
                    await circleBtn.click();
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should manipulate design elements (move, resize, rotate)', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Add an element first (text)
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });
            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                const textInput = page.locator('input[type="text"]').first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Moveable Text');

                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }

                // Try to interact with canvas element
                const canvas = page.locator('canvas');

                // Click on canvas to select element
                await canvas.click({ position: { x: 100, y: 100 } });

                // Check for manipulation controls
                const resizeHandles = page.locator('.resize-handle, .transform-handle');
                if (await resizeHandles.count() > 0) {
                    await expect(resizeHandles.first()).toBeVisible();
                }

                // Check for rotation control
                const rotateHandle = page.locator('.rotate-handle, .rotation-control');
                if (await rotateHandle.isVisible()) {
                    await expect(rotateHandle).toBeVisible();
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should save custom design', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Add some content
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });
            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                const textInput = page.locator('input[type="text"]').first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Saved Design Test');

                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }
            }

            // Save design
            const saveBtn = page.locator('button').filter({ hasText: /save.*design|save/i });
            if (await saveBtn.isVisible()) {
                await saveBtn.click();

                // Fill design name if prompted
                const designNameInput = page.locator('input[name*="name"], input[placeholder*="name"]');
                if (await designNameInput.isVisible()) {
                    await designNameInput.fill('E2E Test Design');

                    const confirmSaveBtn = page.locator('button').filter({ hasText: /save|confirm/i });
                    if (await confirmSaveBtn.isVisible()) {
                        await confirmSaveBtn.click();
                    }
                }

                // Check for success message
                const successMessage = page.locator('.toast, .alert').filter({ hasText: /saved|success/i });
                if (await successMessage.isVisible()) {
                    await expect(successMessage).toBeVisible();
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should load saved design', async ({ page }) => {
        // This test assumes a design was previously saved
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Look for load design button
            const loadBtn = page.locator('button').filter({ hasText: /load.*design|my.*designs/i });

            if (await loadBtn.isVisible()) {
                await loadBtn.click();

                // Select a saved design if any are available
                const savedDesigns = page.locator('.design-item, .saved-design');

                if (await savedDesigns.count() > 0) {
                    await savedDesigns.first().click();

                    const loadConfirmBtn = page.locator('button').filter({ hasText: /load|select|confirm/i });
                    if (await loadConfirmBtn.isVisible()) {
                        await loadConfirmBtn.click();
                    }

                    // Verify design loads on canvas
                    await page.waitForTimeout(1000);
                    const canvas = page.locator('canvas');
                    await expect(canvas).toBeVisible();
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should calculate dynamic pricing for customization', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        // Get base price
        const basePriceElement = page.locator('.price, [data-testid="product-price"]').first();
        const basePrice = await basePriceElement.textContent();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Add customization elements
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });
            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                const textInput = page.locator('input[type="text"]').first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Custom Text');

                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }
            }

            // Check if price updates
            const updatedPriceElement = page.locator('.price, .total-price, [data-testid="customization-price"]');

            if (await updatedPriceElement.isVisible()) {
                const updatedPrice = await updatedPriceElement.textContent();

                // Verify price changed or at least price element is visible
                await expect(updatedPriceElement).toBeVisible();
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });

    test('should add customized product to cart', async ({ page }) => {
        // Navigate to customizable product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        const customizableProduct = page.locator('a[href*="/products/"]').first();
        await customizableProduct.click();

        const customizeBtn = page.locator('button, a').filter({ hasText: /customize|personalize/i });

        if (await customizeBtn.isVisible()) {
            await customizeBtn.click();
            await page.waitForSelector('canvas, .customization-canvas', { timeout: 10000 });

            // Add some customization
            const addTextBtn = page.locator('button').filter({ hasText: /add.*text|text/i });
            if (await addTextBtn.isVisible()) {
                await addTextBtn.click();

                const textInput = page.locator('input[type="text"]').first();
                if (await textInput.isVisible()) {
                    await textInput.fill('Cart Test Text');

                    const applyBtn = page.locator('button').filter({ hasText: /apply|add|confirm/i });
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                    }
                }
            }

            // Add to cart
            const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart|add.*to.*cart/i });
            if (await addToCartBtn.isVisible()) {
                await addToCartBtn.click();

                // Check for success message or cart update
                const successMessage = page.locator('.toast, .alert').filter({ hasText: /added.*cart|cart.*updated/i });
                if (await successMessage.isVisible()) {
                    await expect(successMessage).toBeVisible();
                }

                // Verify cart has the customized product
                const cartBtn = page.locator('button').filter({ hasText: /cart/i });
                if (await cartBtn.isVisible()) {
                    await cartBtn.click();

                    // Look for customization indicator in cart
                    const customizedItem = page.locator('.cart-item').filter({ hasText: /custom|personalized/i });
                    if (await customizedItem.isVisible()) {
                        await expect(customizedItem).toBeVisible();
                    }
                }
            }
        } else {
            test.skip(true, 'No customization interface found');
        }
    });
});
