#!/usr/bin/env node

// Comprehensive Email System Test Script
// Run with: node scripts/comprehensive-email-test.mjs

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        console.log(`🧪 Testing ${method} ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (response.ok) {
            console.log(`✅ ${endpoint} - Success:`, data.message || 'OK');
            return { success: true, data };
        } else {
            console.log(`❌ ${endpoint} - Error ${response.status}:`, data.message || data.error);
            return { success: false, error: data, status: response.status };
        }
    } catch (error) {
        console.log(`❌ ${endpoint} - Network Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runEmailTests() {
    console.log('🧪 UselfUnik Email System Comprehensive Test\n');
    console.log('=' * 50);

    const testResults = {
        newsletter: { subscribe: false, unsubscribe: false },
        auth: { forgotPassword: false, resetPassword: false, verifyEmail: false },
        admin: { orderEmails: false, notificationEmails: false },
        general: { contactForm: false }
    };

    // Test 1: Newsletter Subscription
    console.log('\n📬 Testing Newsletter Functionality');
    console.log('-'.repeat(40));

    const testEmail = `test+${Date.now()}@example.com`;

    const subscribeResult = await testAPI('/api/newsletter/subscribe', 'POST', {
        email: testEmail,
        source: 'test'
    });

    testResults.newsletter.subscribe = subscribeResult.success;

    // Test 2: Password Reset Flow
    console.log('\n🔐 Testing Password Reset Functionality');
    console.log('-'.repeat(40));

    const forgotResult = await testAPI('/api/auth/forgot-password', 'POST', {
        email: testEmail
    });

    testResults.auth.forgotPassword = forgotResult.success;

    // Test 3: Newsletter Unsubscribe (using a mock token)
    console.log('\n📪 Testing Newsletter Unsubscribe');
    console.log('-'.repeat(40));

    const unsubscribeResult = await testAPI(
        `/api/newsletter/unsubscribe?email=${encodeURIComponent(testEmail)}&token=mock-token`,
        'GET'
    );

    testResults.newsletter.unsubscribe = unsubscribeResult.success || unsubscribeResult.status === 404; // 404 is expected for mock token

    // Test 4: User Registration (which should trigger email verification)
    console.log('\n👤 Testing User Registration & Email Verification');
    console.log('-'.repeat(40));

    const registerResult = await testAPI('/api/auth/register', 'POST', {
        name: 'Test User',
        email: testEmail,
        password: 'TestPassword123!'
    });

    testResults.auth.verifyEmail = registerResult.success;

    // Display Results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' * 50);

    console.log('\n📬 Newsletter System:');
    console.log(`  Subscribe: ${testResults.newsletter.subscribe ? '✅' : '❌'}`);
    console.log(`  Unsubscribe: ${testResults.newsletter.unsubscribe ? '✅' : '❌'}`);

    console.log('\n🔐 Authentication System:');
    console.log(`  Forgot Password: ${testResults.auth.forgotPassword ? '✅' : '❌'}`);
    console.log(`  User Registration: ${testResults.auth.verifyEmail ? '✅' : '❌'}`);

    // Calculate overall health
    const totalTests = Object.values(testResults).reduce((acc, category) =>
        acc + Object.values(category).length, 0
    );

    const passedTests = Object.values(testResults).reduce((acc, category) =>
        acc + Object.values(category).filter(Boolean).length, 0
    );

    const healthPercentage = Math.round((passedTests / totalTests) * 100);

    console.log(`\n🏥 Overall Email System Health: ${healthPercentage}% (${passedTests}/${totalTests} tests passed)`);

    if (healthPercentage < 80) {
        console.log('\n⚠️  Email system needs attention! Check the failed tests above.');
    } else if (healthPercentage < 100) {
        console.log('\n⚠️  Most email functionality is working, but some issues detected.');
    } else {
        console.log('\n🎉 All email functionality is working perfectly!');
    }

    return testResults;
}

// Additional helper function to test email configuration
async function testEmailConfiguration() {
    console.log('\n⚙️  Testing Email Configuration');
    console.log('-'.repeat(40));

    const envVars = [
        'EMAIL_SERVER_HOST',
        'EMAIL_SERVER_PORT',
        'EMAIL_SERVER_USER',
        'EMAIL_SERVER_PASSWORD',
        'EMAIL_FROM'
    ];

    envVars.forEach(envVar => {
        const value = process.env[envVar];
        if (value) {
            console.log(`✅ ${envVar}: Set`);
        } else {
            console.log(`❌ ${envVar}: Missing`);
        }
    });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runEmailTests()
        .then(() => {
            console.log('\n📧 Email test completed!');
            console.log('\n💡 Next Steps:');
            console.log('1. Check your email inbox for test emails');
            console.log('2. Verify email templates look correct');
            console.log('3. Test admin email notifications manually');
            console.log('4. Review server logs for any email errors');
        })
        .catch(error => {
            console.error('Test script error:', error);
            process.exit(1);
        });
}

export { runEmailTests, testEmailConfiguration };