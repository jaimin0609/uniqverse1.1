# Test info

- Name: Authentication Flow >> should show error for invalid login credentials
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\auth.spec.ts:261:9

# Error details

```
Error: Timed out 2000ms waiting for expect(locator).toBeVisible()

Locator: locator('.error, [role="alert"], .text-red-500').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 2000ms
  - waiting for locator('.error, [role="alert"], .text-red-500').first()

    at C:\Users\James\Desktop\uniqverse-v1\e2e\auth.spec.ts:288:40
```

# Page snapshot

```yaml
- banner:
  - link "UniQVerse":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Shop":
      - /url: /shop
    - button "Categories"
    - link "All Categories":
      - /url: /categories
    - link "Shop Featured":
      - /url: /shop/featured
    - link "New Arrivals":
      - /url: /shop/new
    - link "About":
      - /url: /about
    - link "Careers":
      - /url: /careers
    - link "Support":
      - /url: /support
    - link "Contact":
      - /url: /contact
  - button "Search"
  - text: Search /
  - button "Settings"
  - button "Open shopping cart"
  - link "Sign In":
    - /url: /auth/login
    - button "Sign In"
  - button "Open menu"
- main:
  - link "Uniqverse":
    - /url: /
  - heading "Welcome back" [level=2]
  - paragraph:
    - text: Don't have an account?
    - link "Create an account":
      - /url: /auth/register
  - text: Email address
  - textbox "Email address"
  - text: Password
  - textbox "Password"
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot your password?":
    - /url: /auth/forgot-password
  - button "Sign in"
  - text: Or continue with
  - button "Sign in with Google":
    - img
    - text: Sign in with Google
  - heading "Shop Unique, Live Unique" [level=2]
  - paragraph: Discover custom-designed products that reflect your unique personality.
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  188 |             console.log('Direct redirect failed, checking current state...');
  189 |
  190 |             const newUrl = page.url();
  191 |             console.log('Current URL after submit:', newUrl);
  192 |
  193 |             // If we moved away from login page, it might be processing
  194 |             if (!newUrl.includes('/auth/login')) {
  195 |                 console.log('Moved away from login page - login may be processing');
  196 |
  197 |                 // Wait a bit more for any delayed redirect
  198 |                 await page.waitForTimeout(5000);
  199 |
  200 |                 // Check if we eventually get to homepage
  201 |                 try {
  202 |                     await page.waitForURL('/', { timeout: 10000 });
  203 |                     const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  204 |                     await expect(userDropdown).toBeVisible({ timeout: 5000 });
  205 |                     loginSuccess = true;
  206 |                 } catch {
  207 |                     console.log('No redirect to homepage detected');
  208 |                 }
  209 |             } else {
  210 |                 // Still on login page - check for success indicators
  211 |                 console.log('Still on login page after submit');
  212 |
  213 |                 // Check if page is loading or processing
  214 |                 const loadingIndicators = await page.locator('.loading, .spinner, [aria-busy="true"]').all();
  215 |                 if (loadingIndicators.length > 0) {
  216 |                     console.log('Found loading indicators, waiting longer...');
  217 |                     await page.waitForTimeout(8000);
  218 |
  219 |                     // Try redirect again
  220 |                     try {
  221 |                         await page.waitForURL('/', { timeout: 10000 });
  222 |                         const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  223 |                         await expect(userDropdown).toBeVisible({ timeout: 5000 });
  224 |                         loginSuccess = true;
  225 |                     } catch {
  226 |                         console.log('Still no redirect after loading');
  227 |                     }
  228 |                 }
  229 |             }
  230 |         }
  231 |
  232 |         // If still not successful, try navigating to home manually to verify login
  233 |         if (!loginSuccess) {
  234 |             console.log('Attempting manual navigation to verify login...');
  235 |             await page.goto('/', { timeout: 15000 });
  236 |
  237 |             try {
  238 |                 const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  239 |                 await expect(userDropdown).toBeVisible({ timeout: 10000 });
  240 |                 loginSuccess = true;
  241 |                 console.log('Manual verification successful - user is logged in');
  242 |             } catch {
  243 |                 console.log('Manual verification failed - user not logged in');
  244 |
  245 |                 // Check if we can see login-related elements that suggest failure
  246 |                 const signInButton = page.locator('link[href="/auth/login"], button:has-text("Sign In")').first();
  247 |                 const isSignInVisible = await signInButton.isVisible().catch(() => false);
  248 |
  249 |                 if (isSignInVisible) {
  250 |                     console.log('Sign In button still visible - login definitely failed');
  251 |                 } else {
  252 |                     console.log('No clear login failure indicators, but user dropdown not found');
  253 |                 }
  254 |             }
  255 |         }
  256 |
  257 |         // Final assertion
  258 |         expect(loginSuccess).toBeTruthy();
  259 |     });
  260 |
  261 |     test('should show error for invalid login credentials', async ({ page }) => {
  262 |         await page.goto('/auth/login', { timeout: 30000 });
  263 |         await page.waitForLoadState('networkidle', { timeout: 30000 });
  264 |
  265 |         // Fill with invalid credentials
  266 |         await page.fill('input[name="email"]', 'invalid@example.com'); await page.fill('input[name="password"]', 'wrongpassword');
  267 |
  268 |         // Submit form using the test selector
  269 |         await page.click('[data-testid="login-submit-button"]');
  270 |
  271 |         // Wait for error state
  272 |         await page.waitForTimeout(3000);
  273 |
  274 |         // Should stay on login page
  275 |         await expect(page).toHaveURL(/\/auth\/login/);
  276 |
  277 |         // Check for error message (be flexible about the format)
  278 |         try {
  279 |             const errorToast = page.locator('[data-sonner-toast]').first();
  280 |             await expect(errorToast).toBeVisible({ timeout: 5000 });
  281 |         } catch {
  282 |             try {
  283 |                 const errorText = page.getByText(/invalid.*credentials/i).first();
  284 |                 await expect(errorText).toBeVisible({ timeout: 3000 });
  285 |             } catch {
  286 |                 // Check for any error indication
  287 |                 const anyError = page.locator('.error, [role="alert"], .text-red-500').first();
> 288 |                 await expect(anyError).toBeVisible({ timeout: 2000 });
      |                                        ^ Error: Timed out 2000ms waiting for expect(locator).toBeVisible()
  289 |             }
  290 |         }
  291 |     }); test('should logout successfully', async ({ page }) => {
  292 |         // Login first using the same robust logic as the login test
  293 |         await page.goto('/auth/login', { timeout: 30000 });
  294 |         await page.waitForLoadState('networkidle', { timeout: 30000 });
  295 |
  296 |         const loginEmail = 'jaimin0609@gmail.com';
  297 |         const loginPassword = '6941@Sjp';        // Fill login form properly with validation
  298 |         await page.fill('input[name="email"]', loginEmail);
  299 |         await page.fill('input[name="password"]', loginPassword);
  300 |         await page.waitForTimeout(1000);
  301 |
  302 |         // Verify form fields are filled correctly - critical for WebKit
  303 |         const emailValue = await page.locator('input[name="email"]').inputValue();
  304 |         const passwordValue = await page.locator('input[name="password"]').inputValue();
  305 |         console.log('Login email field value:', emailValue);
  306 |         console.log('Password field filled:', passwordValue.length > 0 ? 'Yes' : 'No');
  307 |
  308 |         // If email field is empty (WebKit issue), try alternative filling method
  309 |         if (!emailValue || emailValue.trim() === '') {
  310 |             console.log('Email field empty, trying alternative filling method...');
  311 |             await page.locator('input[name="email"]').clear();
  312 |             await page.locator('input[name="email"]').type(loginEmail, { delay: 50 });
  313 |             await page.waitForTimeout(500);
  314 |
  315 |             const emailValueRetry = await page.locator('input[name="email"]').inputValue();
  316 |             console.log('Email field value after retry:', emailValueRetry);
  317 |         }
  318 |
  319 |         // Submit login
  320 |         const submitButton = page.locator('[data-testid="login-submit-button"]');
  321 |         await expect(submitButton).toBeVisible();
  322 |         await expect(submitButton).toBeEnabled();
  323 |         await submitButton.click({ timeout: 10000 });
  324 |
  325 |         console.log('Login submitted for logout test, waiting for completion...');
  326 |         await page.waitForTimeout(5000);
  327 |
  328 |         // Ensure login is successful with flexible detection
  329 |         let loginSuccess = false;
  330 |
  331 |         // Try waiting for redirect first
  332 |         try {
  333 |             await page.waitForURL('/', { timeout: 15000 });
  334 |             console.log('Successfully redirected to homepage');
  335 |             loginSuccess = true;
  336 |         } catch (redirectError) {
  337 |             console.log('Direct redirect failed, checking current state...');
  338 |
  339 |             const newUrl = page.url();
  340 |             console.log('Current URL after login submit:', newUrl);
  341 |
  342 |             // If we moved away from login page, it might be processing
  343 |             if (!newUrl.includes('/auth/login')) {
  344 |                 console.log('Moved away from login page - login may be processing');
  345 |                 await page.waitForTimeout(5000);
  346 |
  347 |                 try {
  348 |                     await page.waitForURL('/', { timeout: 10000 });
  349 |                     loginSuccess = true;
  350 |                 } catch {
  351 |                     console.log('No redirect to homepage detected');
  352 |                 }
  353 |             }
  354 |         }
  355 |
  356 |         // If still not successful, try navigating to home manually to verify login
  357 |         if (!loginSuccess) {
  358 |             console.log('Attempting manual navigation to verify login...');
  359 |             await page.goto('/', { timeout: 15000 });
  360 |         }        // Now ensure user dropdown is visible
  361 |         const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  362 |         await expect(userDropdown).toBeVisible({ timeout: 10000 });
  363 |
  364 |         // WebKit debugging: Log what we found
  365 |         const dropdownText = await userDropdown.textContent();
  366 |         console.log('User dropdown text:', dropdownText);
  367 |
  368 |         // Try multiple interaction patterns for WebKit
  369 |         await userDropdown.hover();
  370 |         await page.waitForTimeout(500);
  371 |         await userDropdown.click();
  372 |
  373 |         // Wait longer for dropdown to appear in WebKit
  374 |         await page.waitForTimeout(2000);
  375 |
  376 |         // Extensive debugging for WebKit
  377 |         console.log('=== WEBKIT DROPDOWN DEBUG ===');
  378 |
  379 |         // Check all visible links
  380 |         const allLinks = await page.locator('a:visible').all();
  381 |         console.log(`Total visible links: ${allLinks.length}`);
  382 |
  383 |         for (let i = 0; i < Math.min(allLinks.length, 15); i++) {
  384 |             const text = await allLinks[i].textContent();
  385 |             const href = await allLinks[i].getAttribute('href');
  386 |             const testId = await allLinks[i].getAttribute('data-testid');
  387 |             console.log(`Link ${i}: text="${text}" href="${href}" testid="${testId}"`);
  388 |         }
```