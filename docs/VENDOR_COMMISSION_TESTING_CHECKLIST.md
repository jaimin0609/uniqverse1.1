# Vendor Management System Testing Checklist

## Overview
This document provides a comprehensive testing checklist for the enhanced vendor management system with commission functionality, email notifications, and advanced analytics.

## Prerequisites
- Development server running (`npm run dev`)
- Database migrations applied (`npx prisma generate`)
- Test vendor account available
- Admin account available for testing admin features

## 1. Email Notification System Tests

### 1.1 Vendor Application Notifications
- [ ] **Test new vendor application submission**
  - Navigate to vendor application page
  - Submit a complete application
  - Verify admin receives notification email
  - Check email content includes applicant details

- [ ] **Test application status change notifications**
  - Admin approves/rejects vendor application
  - Verify applicant receives status update email
  - Test both approval and rejection email templates

### API Endpoints to Test:
- `POST /api/vendor/apply` - Should send admin notification
- `PUT /api/admin/vendor/applications/[id]` - Should send applicant notification

## 2. Commission System Tests

### 2.1 Commission Calculation
- [ ] **Test commission creation on order payment**
  - Create test order with vendor products
  - Complete payment flow (Stripe webhook simulation)
  - Verify commissions are created in database
  - Check commission amounts are calculated correctly

### 2.2 Commission Settings
- [ ] **Test vendor commission settings API**
  - `GET /api/vendor/commission-settings` - Retrieve settings
  - `PUT /api/vendor/commission-settings` - Update settings
  - Verify default commission rates are applied

### 2.3 Commission Analytics
- [ ] **Test vendor commission analytics**
  - `GET /api/vendor/commissions` - Get commission data
  - Verify analytics include:
    - Total commissions earned
    - Period comparisons
    - Daily commission breakdown
    - Top earning products

### 2.4 Payout Management
- [ ] **Test vendor payout history**
  - `GET /api/vendor/payouts` - Get payout history
  - Verify payout records display correctly

- [ ] **Test admin payout generation**
  - `POST /api/admin/vendor/payouts` - Generate payouts
  - Verify admin can create payouts for vendors
  - Check payout status transitions

## 3. Enhanced Analytics Dashboard Tests

### 3.1 Analytics API
- [ ] **Test enhanced analytics endpoint**
  - `GET /api/vendor/analytics` - With commission data
  - Verify response includes:
    - Traditional metrics (revenue, orders, products)
    - Commission metrics (total commissions, pending payouts)
    - Commission-specific charts data
    - Top commission products

### 3.2 Performance Metrics API
- [ ] **Test new performance metrics endpoint**
  - `GET /api/vendor/performance` - Comprehensive performance data
  - Test different period parameters (month, quarter, year)
  - Verify response includes:
    - Summary metrics
    - Product performance breakdown
    - Category performance
    - Rating distribution
    - Performance trends

### 3.3 Analytics Dashboard UI
- [ ] **Test analytics page rendering**
  - Navigate to `/vendor/analytics`
  - Verify commission cards display correctly
  - Check commission analytics sections
  - Test date range filtering
  - Verify export functionality

## 4. Stripe Webhook Integration Tests

### 4.1 Commission Creation on Payment Success
- [ ] **Test webhook integration**
  - Simulate successful payment webhook
  - Verify `VendorCommissionService.createCommissionsForOrder()` is called
  - Check commission records are created
  - Verify error handling for commission creation failures

### Testing Steps:
1. Create test order with vendor products
2. Trigger Stripe webhook for `payment_intent.succeeded`
3. Check database for commission records
4. Verify commission amounts match expected calculations

## 5. Database Schema Validation

### 5.1 New Tables and Relationships
- [ ] **Verify commission system tables exist**
  - `VendorCommission` table
  - `VendorPayout` table  
  - `VendorCommissionSettings` table

- [ ] **Check table relationships**
  - Commission → Vendor (User)
  - Commission → Product
  - Commission → Order
  - Commission → OrderItem
  - Payout → Vendor (User)
  - Settings → Vendor (User)

- [ ] **Verify enum types**
  - `CommissionStatus` (PENDING, PAID, CANCELLED)
  - `PayoutStatus` (PENDING, PROCESSING, COMPLETED, FAILED)

## 6. Error Handling and Edge Cases

### 6.1 Commission System Edge Cases
- [ ] **Test commission calculation edge cases**
  - Orders with multiple vendors
  - Refunded orders (commission reversal)
  - Cancelled orders
  - Zero-amount orders

- [ ] **Test API error handling**
  - Invalid vendor IDs
  - Missing commission settings
  - Database connection failures
  - Malformed request data

### 6.2 Email System Edge Cases
- [ ] **Test email failure scenarios**
  - Invalid email addresses
  - SMTP server unavailable
  - Email template rendering errors

## 7. Security and Authorization Tests

### 7.1 Vendor API Authorization
- [ ] **Test vendor-only endpoints**
  - Verify non-vendors cannot access vendor APIs
  - Test session validation
  - Check vendor-specific data filtering

### 7.2 Admin API Authorization
- [ ] **Test admin-only endpoints**
  - Verify non-admins cannot access admin APIs
  - Test admin permission checks
  - Verify admin can access all vendor data

## 8. Performance and Optimization Tests

### 8.1 API Performance
- [ ] **Test analytics API performance**
  - Large datasets (many orders/products)
  - Complex date range queries
  - Commission calculation performance

### 8.2 Database Query Optimization
- [ ] **Verify efficient queries**
  - Check for N+1 query problems
  - Verify proper database indexes
  - Test query performance with large datasets

## 9. Integration Testing

### 9.1 End-to-End Vendor Flow
- [ ] **Complete vendor journey test**
  1. Apply as vendor → Email notifications sent
  2. Get approved → Status notification received
  3. Add products → Commission settings configured
  4. Receive orders → Commissions calculated
  5. View analytics → Commission data displayed
  6. Request payout → Payout processed

### 9.2 Admin Management Flow
- [ ] **Complete admin management test**
  1. Review vendor applications
  2. Approve/reject applications
  3. Generate vendor payouts
  4. Monitor commission system
  5. View vendor performance metrics

## 10. Manual Testing Scenarios

### 10.1 Real User Testing
- [ ] **Create test vendor account**
- [ ] **Test full vendor application process**
- [ ] **Test product creation and commission setup**
- [ ] **Simulate customer orders**
- [ ] **Test commission tracking and analytics**
- [ ] **Test payout request and processing**

### 10.2 Cross-browser Testing
- [ ] **Test on different browsers**
  - Chrome
  - Firefox
  - Safari
  - Edge

### 10.3 Mobile Responsiveness
- [ ] **Test analytics dashboard on mobile**
- [ ] **Test commission interfaces on mobile**

## Test Data Setup

### Required Test Data:
1. **Test Vendor Account**
   - Email: `testvendor@example.com`
   - Role: `VENDOR`
   - Status: `APPROVED`

2. **Test Products**
   - Multiple products with different commission rates
   - Products in different categories

3. **Test Orders**
   - Orders with vendor products
   - Orders with mixed vendor/non-vendor products
   - Completed and pending orders

4. **Test Commission Settings**
   - Default commission rates
   - Custom commission rates per product

## Success Criteria

### All tests pass when:
- ✅ Email notifications are sent and received correctly
- ✅ Commissions are calculated and tracked accurately
- ✅ Analytics dashboard displays comprehensive data
- ✅ API endpoints respond correctly with proper authorization
- ✅ Database schema supports all commission operations
- ✅ Error handling works for edge cases
- ✅ Performance is acceptable for expected load
- ✅ Security measures are properly implemented

## Notes
- Test with both development and staging environments
- Monitor server logs during testing for errors
- Verify email delivery in development/staging
- Test with realistic data volumes
- Document any issues found during testing

## Completion Status
- [ ] Email notification system tests completed
- [ ] Commission system tests completed  
- [ ] Analytics dashboard tests completed
- [ ] Stripe webhook integration tests completed
- [ ] Database schema validation completed
- [ ] Error handling tests completed
- [ ] Security tests completed
- [ ] Performance tests completed
- [ ] Integration tests completed
- [ ] Manual testing completed

## Final Validation
- [ ] All vendor management features working as specified
- [ ] Commission system fully operational
- [ ] Analytics providing valuable insights
- [ ] System ready for production deployment
