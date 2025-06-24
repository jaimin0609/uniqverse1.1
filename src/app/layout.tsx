import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/layout/header";
import { PromotionBanner } from "@/components/promotion/promotion-banner";
import FooterWithConditional from "@/components/layout/footer-with-conditional";
import { ThemeProvider } from "@/contexts/theme-provider";
import { CurrencyProvider } from "@/contexts/currency-provider";
import ChatBotWrapper from "@/components/support/ChatBotWrapper";
import ToastListener from "@/components/ui/toast-listener";
import { CartProvider } from "@/components/cart/cart-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniQVerse | Modern E-Commerce Platform",
  description: "A modern e-commerce platform for unique products",
  icons: {
    icon: [
      { url: "/icons/icon-32x32.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192x192.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniQVerse",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366F1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="UniQVerse" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UniQVerse" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366F1" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full flex flex-col`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider defaultCurrency="USD">
            <AuthProvider session={session}>
              {/* Cart provider ensures cart syncs between browser and database */}
              <CartProvider>
                <Header />
                <PromotionBanner className="sticky top-0 z-10" />
                <main className="flex-grow">
                  {children}
                  <Analytics />
                  <SpeedInsights />
                </main>
                <FooterWithConditional />
                <Toaster position="top-center" closeButton richColors toastOptions={{
                  style: {
                    zIndex: 9999
                  }
                }} />
                {/* AI Chatbot component */}
                <ChatBotWrapper />
                {/* Toast notification listener */}
                <ToastListener />
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
