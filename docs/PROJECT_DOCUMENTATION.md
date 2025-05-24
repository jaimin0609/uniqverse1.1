# Uniqverse E-Commerce Platform Documentation

## Project Overview

Uniqverse is a modern, full-featured e-commerce platform built with Next.js and TypeScript. It's designed to provide a seamless shopping experience with support for product customization, multiple variants, and integration with popular payment gateways and shipping providers.

The platform is built as a Progressive Web App (PWA), ensuring it works seamlessly across all devices and can be installed as a native app on mobile devices (iOS and Android) while maintaining optimal performance on mobile browsers.

**Last Updated**: May 12, 2025

## Technology Stack

### Frontend
- **Next.js**: React framework with App Router for handling routing and server-side rendering
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For styling and responsive design
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation library
- **Zustand**: Lightweight state management
- **NextAuth.js**: Authentication solution
- **Sonner**: Toast notification library
- **next-pwa**: For implementing Progressive Web App capabilities

### Mobile & Cross-Platform
- **Progressive Web App (PWA)**: For cross-platform installation and offline capabilities
- **Responsive Design**: Mobile-first approach for optimal user experience on all devices
- **Touch-Optimized UI**: For better mobile interaction

### Backend & Database
- **PostgreSQL**: Primary database
- **Prisma ORM**: Database access and schema management
- **Redis**: For caching to improve performance (planned)

### Payment Processing
- **Stripe**: Payment processing integration

### Infrastructure
- **Docker** (future): For containerization 
- **Vercel** (deployment recommendation): For hosting the application

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── account/            # User account pages
│   ├── admin/              # Admin panel routes
│   ├── api/                # API routes 
│   │   ├── auth/           # Authentication API
│   │   ├── cart/           # Cart management API
│   │   ├── orders/         # Order processing API
│   │   ├── products/       # Product management API
│   │   └── users/          # User management API
│   ├── auth/               # Authentication pages
│   ├── checkout/           # Checkout flow
│   ├── products/           # Product pages
│   └── shop/               # Shop pages
├── components/             # Reusable React components
│   ├── auth-provider.tsx   # NextAuth provider
│   ├── cart/               # Cart related components
│   ├── checkout/           # Checkout related components
│   ├── layout/             # Layout components
│   ├── product/            # Product related components
│   └── ui/                 # UI components
├── contexts/               # React context providers
├── generated/              # Generated Prisma client
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries
│   ├── db.ts               # Database client
│   └── validations/        # Zod validation schemas
├── middleware/             # Next.js middleware
├── services/               # Service layer for API calls
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Core Features

### User Management
- **Authentication**: Email/password and social login (Google OAuth)
- **User Roles**: Admin, Customer, Manager
- **Profile Management**: User details, addresses, order history
- **Wish List**: Save favorite products

### Customer Support
- **AI Chatbot**: Automated responses to common queries using pattern matching and AI.
- **Support Ticket System**: Users can create, manage, and track support tickets.
- **FAQ Management**: Admin-managed Frequently Asked Questions.

### Product Management
- **Product Catalog**: Browsing products with filtering and sorting
- **Categories**: Hierarchical product categories
- **Product Details**: Rich product information with images
- **Product Variants**: Support for different product options (size, color, etc.)
- **Featured Products**: Highlighted products on homepage
- **Product Customization**: Option for personalized products

### Shopping Experience
- **Shopping Cart**: Add products, manage quantities, persist between sessions
- **Checkout Process**: Multi-step checkout with shipping and payment options
- **Order Management**: View and track orders
- **Reviews & Ratings**: Product review system with moderation

### Admin Features
- **Dashboard**: Overview of sales, orders, and inventory
- **Product Management**: Add, edit, and delete products
- **Order Management**: Process and fulfill orders
- **User Management**: Manage customer accounts
- **Content Management**: Update site content
- **Inventory Management**: Track stock levels with alerts

### Supplier & Inventory Management
- **Supplier Integration**: Connect with product suppliers
- **Inventory Tracking**: Monitor stock levels with history
- **Low Stock Alerts**: Automated notifications
- **Dropshipping Support**: Integration with supplier fulfillment

### Analytics & Performance
- **Performance Metrics**: Track page performance
- **User Metrics**: Monitor user behavior
- **Resource Metrics**: Track resource loading performance

## Database Schema

The database schema is managed through Prisma and includes the following main models:

- **User**: Customer accounts with authentication details and role management
- **Product**: Product information with pricing, inventory and supplier data
- **ProductVariant**: Product variations with separate pricing and inventory
- **Category**: Product categories with hierarchical structure
- **Order**: Customer orders with line items and status tracking
- **Review**: Product reviews and ratings with moderation
- **Cart & CartItem**: Shopping cart functionality
- **Address**: Customer shipping and billing addresses
- **Supplier**: Product supplier management
- **InventoryHistory**: Tracking of inventory changes
- **Blog & Page**: Content management
- **ChatbotPattern, ChatbotTrigger, ChatbotFallback**: For AI chatbot functionality
- **SupportTicket, TicketReply, TicketAttachment**: For customer support ticketing system

For the complete schema, refer to the `prisma/schema.prisma` file.

## Authentication System

Authentication is handled by NextAuth.js with the following providers:
- Email/Password (credentials)
- Google OAuth

User sessions are maintained using JWT tokens and stored in cookies.

## State Management

### Cart State
The shopping cart uses Zustand with persistence to maintain cart items across sessions:
- Add items to cart
- Update quantities
- Remove items
- Calculate subtotals
- Guest cart merging capability

### UI State
Various UI states (modals, drawers, form states) are managed using React's useState and useReducer hooks where appropriate.

## API Integration

### Internal API
- RESTful API endpoints under `/api` routes
- Type-safe API requests with TypeScript
- Comprehensive endpoints for products, users, cart, orders, and more

### External APIs
- **Stripe**: Complete payment processing with webhook handlers for all payment statuses
  - Successful payments
  - Failed payments
  - Cancelled payments
  - Refunds (full and partial)
  - Processing status updates
  - 3D Secure authentication support
- **Supplier APIs**: For dropshipping integration (planned)
- **Support System APIs**: Endpoints for managing chatbot patterns, support tickets, and FAQs.

## Progressive Web App Features

The application is configured as a PWA with:
- App manifest for installation
- Service worker for offline capabilities
- Icon sets for various platforms
- Optimized mobile experience

## Dropshipping Integration

Uniqverse includes a comprehensive dropshipping system that allows automatic order fulfillment through third-party suppliers. The system is designed to handle all aspects of the dropshipping workflow, from product sourcing to order fulfillment tracking.

### Key Features

- **Automatic Order Processing**: Orders are automatically processed for dropshipping when payment is successful
- **Supplier Management**: Connect with multiple dropshipping suppliers
- **API Integration**: Pre-built integrations with popular dropshipping platforms (AliExpress, Spocket, CJ Dropshipping, Oberlo, Modalyst)
- **Order Tracking**: Automatic tracking of supplier order status with customer order updates
- **Manual Controls**: Admin tools for reviewing and manually triggering dropshipping processes
- **Status Synchronization**: Automatic updates to customer orders based on supplier fulfillment status

### Dropshipping Architecture

The dropshipping system has three main components:

1. **DropshippingService**: The core service that handles order processing, supplier communication, and status updates
2. **Supplier API Clients**: API clients for different suppliers that handle the specific API requirements of each platform
3. **API Endpoints**: Webhooks and endpoints for order processing and status updates

### Workflow

1. **Order Placement**: 
   - Customer places an order containing one or more dropshipping products
   - Payment is processed through Stripe

2. **Automatic Processing**: 
   - Upon successful payment, the system identifies products sourced from dropshipping suppliers
   - Orders are grouped by supplier and supplier orders are created
   - If the supplier has API credentials, orders are automatically sent to suppliers

3. **Order Tracking**:
   - The system periodically checks for status updates from suppliers
   - As suppliers ship products, tracking information is automatically updated
   - Customer orders are marked as fulfilled or partially fulfilled based on supplier status

4. **Fulfillment Completion**:
   - When all items are fulfilled by suppliers, the order is marked as completely fulfilled

### Supplier Integration

Each supplier integration requires:
- **API Key**: Authentication credentials for the supplier API
- **API Endpoint**: The base URL for the supplier's API
- **Product Mapping**: Mapping store products to supplier product IDs

Supported supplier platforms include:
- AliExpress
- Spocket
- CJ Dropshipping
- Oberlo
- Modalyst
- Custom suppliers (via generic API client)

### Admin Tools

Administrators have access to several tools for managing dropshipping:

1. **Manual Processing**: Trigger dropshipping process for specific orders
2. **Order Review**: Review supplier orders before sending to suppliers
3. **Status Updates**: Manually check for order status updates
4. **Supplier Management**: Configure supplier API connections and settings

### API Endpoints

- **POST /api/admin/orders/[id]/process-dropshipping**: Manually process dropshipping for an order
- **POST /api/admin/supplier-orders/[id]/send**: Send a supplier order to the supplier API
- **POST /api/admin/supplier-orders/check-updates**: Check for status updates from supplier APIs

### Status Mapping

The system maps between supplier-specific statuses and internal standardized statuses:

| Internal Status | Description |
|----------------|-------------|
| PENDING | Order created but not yet processed by supplier |
| PROCESSING | Order accepted and being processed by supplier |
| SHIPPED | Order has been shipped by supplier |
| COMPLETED | Order has been delivered to customer |
| CANCELLED | Order was cancelled |

### Best Practices

1. **Configure suppliers** before importing their products
2. **Test the integration** with each supplier using manual processing before enabling automatic sending
3. **Monitor order status** regularly to catch any issues with supplier fulfillment
4. **Set up scheduled status checks** to keep order statuses up to date

## Payment Processing

The application uses Stripe for payment processing with the following features:

### Payment Flow
- Secure client-side card collection with Stripe Elements
- Server-side payment intent creation
- Support for 3D Secure authentication
- Real-time status updates via webhooks
- Comprehensive error handling and recovery

### Payment Statuses
- **PENDING**: Initial payment state or processing
- **PAID**: Successfully processed payment
- **FAILED**: Payment attempt failed
- **CANCELLED**: Payment was cancelled
- **REFUNDED**: Full refund processed
- **PARTIALLY_REFUNDED**: Partial refund processed

### Inventory Management on Payment Status Changes
- Automatic inventory reservation on order creation
- Automatic inventory restoration on payment cancellation or refund
- Inventory history tracking for all changes

### Error Recovery
- Clear user feedback for payment errors with specific messages
- Support for retrying failed payments
- Automatic order status updates based on payment events

## Promotion and Event System

Uniqverse includes a comprehensive promotion and event management system that enables dynamic marketing campaigns, promotional content, and special offers.

### Promotion System

The promotion system allows for the creation and management of various promotional content types displayed to customers throughout the store.

#### Key Features

- **Multiple Promotion Types**:
  - **Banners**: Full-width promotional banners
  - **Sliders**: Carousel-style promotional content
  - **Featured Content**: Highlighted promotional areas

- **Content Management**:
  - Rich media support (images and videos)
  - Custom text and styling options
  - URL linking to specific products, categories, or external content
  - Position control for content placement

- **Scheduling & Activation**:
  - Date-based scheduling (start and end dates)
  - Manual activation/deactivation controls
  - Automatic status management based on dates

- **Admin Controls**:
  - Comprehensive management interface
  - Drag-and-drop positioning
  - Preview capabilities
  - Quick status toggling

#### Promotion Model Structure

The Promotion model includes the following fields:

| Field        | Type          | Description                              |
|--------------|---------------|------------------------------------------|
| id           | String        | Unique identifier for the promotion      |
| title        | String        | Title of the promotion                   |
| description  | String?       | Optional description text                |
| type         | PromotionType | Type of promotion (BANNER, etc.)         |
| imageUrl     | String?       | Optional image URL                       |
| videoUrl     | String?       | Optional video URL                       |
| linkUrl      | String?       | Optional URL to link to                  |
| position     | Int           | Position order for multiple promotions   |
| startDate    | DateTime      | When the promotion starts displaying     |
| endDate      | DateTime      | When the promotion stops displaying      |
| isActive     | Boolean       | Whether the promotion is active          |
| createdAt    | DateTime      | When the promotion was created           |
| updatedAt    | DateTime      | When the promotion was last updated      |

#### Components & Implementation

- **Promotion Banner**: Top banner for announcements, sales, new arrivals
  - Responsive design that adapts to different screen sizes
  - Support for both text and media content
  - Clickable link to relevant pages
  
- **Promotional Feature**: Highlighted promotional content in strategic page locations
  - Can be placed in different sections of the website
  - Supports flexible content types
  
- **Admin Interface**: Full CRUD operations for managing promotional content
  - Drag-and-drop interface for positioning promotions
  - Date range picker for scheduling
  - Live preview of promotions before publishing
  - Quick status toggle for immediate activation/deactivation

#### API Endpoints

- **GET /api/promotions**: Retrieve all promotions or filter by type and active status
  - Query parameters:
    - `active=true`: Filter to only active promotions
    - `type=BANNER`: Filter by promotion type
- **GET /api/promotions/[id]**: Get a specific promotion by ID
- **POST /api/promotions**: Create a new promotion (admin only)
- **PUT /api/promotions/[id]**: Update an existing promotion
- **DELETE /api/promotions/[id]**: Delete a promotion

### Event System

The event system manages dynamic content that appears at scheduled times, such as special sales events, holiday promotions, and time-limited offers.

#### Key Features

- **Event Content Management**:
  - Text overlays with customizable position, color, size, and shadow effects
  - Media content (images and videos)
  - Background color and opacity controls
  - Special visual effects (fade, zoom, slide animations)

- **Scheduling & Timing**:
  - Precise start and end date/time settings
  - Automatic activation based on scheduled times
  - Position priority for multiple concurrent events

- **Display Controls**:
  - Event showcase with automatic rotation for multiple events
  - Custom animation and transition effects
  - Responsive design across all device sizes

#### Event Model Structure

The Event model includes the following fields:

| Field           | Type      | Description                                       |
|-----------------|-----------|---------------------------------------------------|
| id              | String    | Unique identifier for the event                   |
| title           | String    | Title of the event                                |
| description     | String?   | Optional description text                         |
| imageUrl        | String?   | URL for the event's image (for image type)        |
| videoUrl        | String?   | URL for the event's video (for video type)        |
| contentType     | String    | Content type ("image" or "video")                 |
| textOverlay     | String?   | Optional text overlay displayed on the event      |
| textPosition    | String    | Position of text ("center", "top-left", etc.)     |
| textColor       | String    | Color code for the text                           |
| textSize        | String    | Text size class (Tailwind CSS classes)            |
| textShadow      | Boolean   | Whether to apply shadow effect to text            |
| backgroundColor | String?   | Optional background color                         |
| opacity         | Int       | Opacity percentage (0-100)                        |
| effectType      | String?   | Animation effect ("fade", "zoom", "slide")        |
| linkUrl         | String?   | Optional URL for the event to link to             |
| startDate       | DateTime  | When the event starts displaying                  |
| endDate         | DateTime  | When the event stops displaying                   |
| isActive        | Boolean   | Whether the event is active                       |
| position        | Int       | Display order position                            |

#### Components & Implementation

- **EventShowcase Component**: A client-side component with the following features:
  - Automatic fetching of active events from the API
  - Carousel functionality with automatic rotation
  - Support for different animation effects
  - Responsive design for all screen sizes
  - Clickable events linking to relevant pages

- **Admin Interface**: Complete event creation and management tools
  - Event creation form with live preview
  - WYSIWYG-style interface for positioning text
  - Date range picker for scheduling
  - Status toggle for quick activation/deactivation
  - Position ordering controls

#### API Endpoints

- **GET /api/events**: Retrieve all events or active events only
  - Query parameters:
    - `active=true`: Filter to only active events
    - `id=<event-id>`: Get a specific event
- **POST /api/events**: Create a new event (admin only)
- **PUT /api/events/[id]**: Update an existing event
- **DELETE /api/events/[id]**: Delete an event

### Coupon System

The promotion system includes coupon functionality for discount codes and special offers.

#### Key Features

- **Coupon Types**:
  - Percentage discounts
  - Fixed amount discounts
  - Free shipping
  - Buy-one-get-one offers

- **Usage Restrictions**:
  - Usage limits (per coupon and per customer)
  - Minimum order value
  - Product or category specific
  - New customer only
  - Expiration dates

- **Tracking & Analytics**:
  - Usage statistics
  - Conversion tracking
  - Revenue impact analysis

#### API Endpoints

- **GET /api/coupons**: Retrieve available coupons
- **POST /api/coupons/validate**: Validate a coupon code
- **POST /api/coupons**: Create a new coupon (admin only)
- **PUT /api/coupons/[id]**: Update a coupon
- **DELETE /api/coupons/[id]**: Delete a coupon

### Cross-System Integration

The promotion and event systems integrate with other platform systems:

- **Order Processing**: Automatic application of valid promotions and coupons
- **User Accounts**: Personalized promotions based on user behavior and preferences
- **Analytics**: Tracking promotion performance and conversion rates
- **Inventory**: Coordination with stock levels for promotion planning
- **Email Marketing**: Synchronized promotional messaging across channels

## Deployment

The application is designed to be deployed to Vercel for optimal performance with Next.js. Environment variables should be configured for:
- Database connection
- Authentication secrets
- Payment processing API keys
- External service API keys

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- (Optional) Redis instance for caching

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

### Development Workflow
1. Run the development server: `npm run dev`
2. Access the application at http://localhost:3000
3. Make changes to code (hot reloading enabled)
4. Test your changes: `npm test` (See Testing Strategy section)

## Testing Strategy

A comprehensive testing strategy is being implemented to ensure code quality, stability, and maintainability. The strategy includes:

- **Unit Tests**: For individual functions, utilities, and components.
  - **Framework**: Jest
  - **Component Testing**: React Testing Library
  - **Location**: Typically within a `__tests__` subdirectory alongside the code being tested (e.g., `src/utils/__tests__`, `src/components/ui/__tests__`).
- **Integration Tests** (Planned): To test interactions between different parts of the application (e.g., API endpoints with database, component interactions).
- **End-to-End (E2E) Tests** (Planned): To simulate real user scenarios across the entire application.

### Running Tests
- To run all tests: `npm test`
- To run tests in watch mode: `npm run test:watch`

### Current Status
- Jest and React Testing Library have been set up and configured correctly.
- Initial unit tests for utility functions (e.g., `formatCurrency`, `cn`) and UI components (e.g., `Button`) have been added and are passing successfully.
- The existing ad-hoc test scripts (e.g., for CJ Dropshipping) will be integrated or refactored into this new testing structure over time.

## Future Improvements

- Implement Redis caching for performance optimization
- Complete payment processing with webhook handling
- Enhance admin dashboard with comprehensive metrics
- Set up CI/CD pipeline
- Add internationalization support
- **Expand comprehensive testing strategy**:
  - Increase unit test coverage across all critical modules.
  - Implement integration tests for API routes and service layers.
  - Develop E2E tests for key user flows (e.g., registration, checkout, admin actions).
- Integrate with multiple payment providers
- Enhance search functionality with autocomplete and advanced filtering