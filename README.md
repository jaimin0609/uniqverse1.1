# Uniqverse E-Commerce Platform

A modern, full-featured e-commerce platform built with Next.js 14+, TypeScript, Tailwind CSS, and Prisma. Designed to provide a seamless shopping experience with support for product customization, variants, and integration with popular payment gateways.

## Features

- 🛒 Full-featured shopping cart and checkout
- 👤 User authentication with NextAuth.js
- 💻 Responsive design with mobile-first approach
- 🖥️ Admin dashboard for product and order management
- 🔍 Advanced search and filtering
- 💳 Stripe payment integration
- 📱 Progressive Web App (PWA) capabilities

## Getting Started

First, set up your environment:

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up your environment variables (copy `.env.example` to `.env.local`)
4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

For more detailed documentation, see:
- [Project Documentation](./docs/PROJECT_DOCUMENTATION.md)
- [Project Progress](./docs/PROJECT_PROGRESS.md)

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, React Hook Form, Zod
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe

## License

[MIT](LICENSE)
