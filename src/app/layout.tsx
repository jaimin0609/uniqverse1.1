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
  metadataBase: new URL('https://uselfunik.com'),
  title: "UselfUnik | Be Uniquely You",
  description: "Express your unique style through our curated collection of personalized products",
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/uselfunik-app-icon.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: "/uselfunik-app-icon.svg",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UselfUnik | Be Uniquely You",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "UselfUnik | Be Uniquely You",
    description: "Express your unique style through our curated collection of personalized products",
    url: "https://uselfunik.com",
    siteName: "UselfUnik",
    images: [
      {
        url: "/uselfunik-app-icon.svg",
        width: 192,
        height: 192,
        alt: "UselfUnik Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "UselfUnik | Be Uniquely You",
    description: "Express your unique style through our curated collection of personalized products",
    images: ["/uselfunik-app-icon.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6C5CE7",
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
        <meta name="application-name" content="UselfUnik" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UselfUnik" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6C5CE7" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/uselfunik-app-icon.svg" />
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
