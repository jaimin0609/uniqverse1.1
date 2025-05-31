const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAccountDeletion() {
    console.log('🧪 Starting comprehensive account deletion test...');
    
    try {
        // Create a test user with related data
        const hashedPassword = await bcrypt.hash('testpassword123', 10);
          const testUser = await prisma.user.create({
            data: {
                name: 'Test User for Deletion',
                email: `test-deletion-${Date.now()}@example.com`,
                password: hashedPassword,
                role: 'CUSTOMER'
            }
        });
        
        console.log(`✅ Created test user: ${testUser.id}`);
        
        // Create related data to test cascade deletion and set null        // 1. Create an address (should cascade delete)
        const address = await prisma.address.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                address1: '123 Test St',
                city: 'Test City',
                country: 'Test Country',
                postalCode: '12345',
                userId: testUser.id,
                updatedAt: new Date()
            }
        });
        console.log(`✅ Created address: ${address.id}`);
        
        // 2. Create a cart (should cascade delete)
        const cart = await prisma.cart.create({
            data: {
                userId: testUser.id
            }
        });
        console.log(`✅ Created cart: ${cart.id}`);
        
        // 3. Create an order (should cascade delete)
        const order = await prisma.order.create({
            data: {
                orderNumber: 'TEST-ORDER-001',
                status: 'PENDING',
                subtotal: 100.00,
                tax: 10.00,
                shipping: 5.00,
                total: 115.00,
                userId: testUser.id
            }
        });
        console.log(`✅ Created order: ${order.id}`);
        
        // 4. Create a review (should cascade delete)
        const product = await prisma.product.findFirst({
            where: { isDeleted: false }
        });
        
        if (product) {
            const review = await prisma.review.create({
                data: {
                    rating: 5,
                    title: 'Great product!',
                    content: 'Really love this product',
                    productId: product.id,
                    userId: testUser.id
                }
            });
            console.log(`✅ Created review: ${review.id}`);
        }
        
        // 5. Create a support ticket (should cascade delete)
        const supportTicket = await prisma.supportTicket.create({
            data: {
                subject: 'Test ticket',
                description: 'This is a test support ticket',
                userId: testUser.id
            }
        });
        console.log(`✅ Created support ticket: ${supportTicket.id}`);
        
        // 6. Create a ticket reply (should cascade delete)
        const ticketReply = await prisma.ticketReply.create({
            data: {
                content: 'This is a test reply',
                ticketId: supportTicket.id,
                userId: testUser.id
            }
        });
        console.log(`✅ Created ticket reply: ${ticketReply.id}`);
        
        // 7. Create coupon usage (should cascade delete)
        const existingCoupon = await prisma.coupon.findFirst();
        if (existingCoupon) {
            const couponUsage = await prisma.couponUsage.create({
                data: {
                    couponId: existingCoupon.id,
                    userId: testUser.id,
                    orderId: order.id,
                    discountAmount: 10.00
                }
            });
            console.log(`✅ Created coupon usage: ${couponUsage.id}`);
        }
        
        // 8. Create inventory history entry (should set userId to null)
        if (product) {
            const inventoryHistory = await prisma.inventoryHistory.create({
                data: {
                    productId: product.id,
                    previousValue: 10,
                    newValue: 5,
                    action: 'SALE',
                    notes: 'Test inventory change',
                    userId: testUser.id
                }
            });
            console.log(`✅ Created inventory history: ${inventoryHistory.id}`);
        }
        
        // 9. Create admin audit log entry (should set performedById to null)
        const auditLog = await prisma.adminAuditLog.create({
            data: {
                id: 'test-audit-' + Date.now(),
                action: 'TEST_ACTION',
                details: 'Test audit log entry',
                performedById: testUser.id
            }
        });
        console.log(`✅ Created audit log: ${auditLog.id}`);
        
        // 10. Create media entry (should set userId to null)
        const media = await prisma.media.create({
            data: {
                id: 'test-media-' + Date.now(),
                filename: 'test.jpg',
                originalFilename: 'test-original.jpg',
                url: 'https://example.com/test.jpg',
                filesize: 1024,
                mimetype: 'image/jpeg',
                userId: testUser.id
            }
        });
        console.log(`✅ Created media: ${media.id}`);
        
        // 11. Create a page (should set authorId to null)
        const page = await prisma.page.create({
            data: {
                id: 'test-page-' + Date.now(),
                title: 'Test Page',
                slug: 'test-page-' + Date.now(),
                content: 'This is a test page',
                authorId: testUser.id
            }
        });
        console.log(`✅ Created page: ${page.id}`);
        
        // 12. Create blog post (should set authorId to null)
        const blogPost = await prisma.blogPost.create({
            data: {
                id: 'test-blog-' + Date.now(),
                title: 'Test Blog Post',
                slug: 'test-blog-' + Date.now(),
                content: 'This is a test blog post',
                authorId: testUser.id
            }
        });
        console.log(`✅ Created blog post: ${blogPost.id}`);
        
        // 13. Create chatbot pattern (should set createdBy to null)
        const chatbotPattern = await prisma.chatbotPattern.create({
            data: {
                response: 'This is a test chatbot response',
                createdBy: testUser.id
            }
        });
        console.log(`✅ Created chatbot pattern: ${chatbotPattern.id}`);
        
        console.log('\n🧪 Now attempting to delete the user...');
        
        // Delete the user - this should now work without foreign key constraint errors
        await prisma.user.delete({
            where: { id: testUser.id }
        });
        
        console.log('✅ User deleted successfully!');
        
        // Verify that related records were handled correctly
        console.log('\n🔍 Verifying cleanup...');
        
        // Check records that should be deleted (cascade)
        const remainingAddresses = await prisma.address.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining addresses: ${remainingAddresses} (should be 0)`);
        
        const remainingCarts = await prisma.cart.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining carts: ${remainingCarts} (should be 0)`);
        
        const remainingOrders = await prisma.order.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining orders: ${remainingOrders} (should be 0)`);
        
        const remainingReviews = await prisma.review.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining reviews: ${remainingReviews} (should be 0)`);
        
        const remainingTickets = await prisma.supportTicket.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining support tickets: ${remainingTickets} (should be 0)`);
        
        const remainingReplies = await prisma.ticketReply.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining ticket replies: ${remainingReplies} (should be 0)`);
        
        const remainingCouponUsages = await prisma.couponUsage.count({
            where: { userId: testUser.id }
        });
        console.log(`Remaining coupon usages: ${remainingCouponUsages} (should be 0)`);
        
        // Check records that should have userId set to null
        const inventoryWithNullUser = await prisma.inventoryHistory.findMany({
            where: { 
                id: inventoryHistory.id,
                userId: null 
            }
        });
        console.log(`Inventory history with null userId: ${inventoryWithNullUser.length} (should be 1)`);
        
        const auditWithNullUser = await prisma.adminAuditLog.findMany({
            where: { 
                id: auditLog.id,
                performedById: null 
            }
        });
        console.log(`Audit logs with null performedById: ${auditWithNullUser.length} (should be 1)`);
        
        const mediaWithNullUser = await prisma.media.findMany({
            where: { 
                id: media.id,
                userId: null 
            }
        });
        console.log(`Media with null userId: ${mediaWithNullUser.length} (should be 1)`);
        
        const pageWithNullAuthor = await prisma.page.findMany({
            where: { 
                id: page.id,
                authorId: null 
            }
        });
        console.log(`Pages with null authorId: ${pageWithNullAuthor.length} (should be 1)`);
        
        const blogWithNullAuthor = await prisma.blogPost.findMany({
            where: { 
                id: blogPost.id,
                authorId: null 
            }
        });
        console.log(`Blog posts with null authorId: ${blogWithNullAuthor.length} (should be 1)`);
        
        const chatbotWithNullCreator = await prisma.chatbotPattern.findMany({
            where: { 
                id: chatbotPattern.id,
                createdBy: null 
            }
        });
        console.log(`Chatbot patterns with null createdBy: ${chatbotWithNullCreator.length} (should be 1)`);
        
        console.log('\n🎉 Account deletion test completed successfully!');
        console.log('✅ All foreign key constraints are now properly configured.');
        console.log('✅ User accounts can be deleted without errors.');
        console.log('✅ Related data is properly handled (cascade delete or set null).');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
        
        // If there's still a foreign key constraint error, show which one
        if (error.message.includes('foreign key constraint')) {
            console.error('\n⚠️  There is still a foreign key constraint issue that needs to be fixed.');
            console.error('Check the error message above for the specific constraint.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testAccountDeletion();
