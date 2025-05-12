'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Package, MapPin, Heart, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Check if the user is authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            window.location.href = "/auth/login?callbackUrl=/account";
        }
    }, [status]);

    const navigationItems: NavItem[] = [
        {
            title: "Account Overview",
            href: "/account",
            icon: <User className="h-5 w-5" />
        },
        {
            title: "Orders",
            href: "/account/orders",
            icon: <Package className="h-5 w-5" />
        },
        {
            title: "Addresses",
            href: "/account/addresses",
            icon: <MapPin className="h-5 w-5" />
        },
        {
            title: "Wishlist",
            href: "/account/wishlist",
            icon: <Heart className="h-5 w-5" />
        },
        {
            title: "Account Settings",
            href: "/account/settings",
            icon: <Settings className="h-5 w-5" />
        }
    ];

    // Loading state
    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    // Only render if authenticated
    if (status === "authenticated" && session?.user) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="md:flex md:gap-10">
                        {/* Sidebar for desktop */}
                        <div className="hidden md:block w-64 flex-shrink-0">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center space-x-3 pb-6 border-b border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        {session.user.image ? (
                                            <img
                                                src={session.user.image}
                                                alt={session.user.name || "User"}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{session.user.name}</p>
                                        <p className="text-sm text-gray-500">{session.user.email}</p>
                                    </div>
                                </div>

                                <nav className="mt-6 flex flex-col space-y-2">
                                    {navigationItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`
                          flex items-center px-3 py-2 rounded-md text-sm
                          ${isActive
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                        `}
                                            >
                                                {item.icon}
                                                <span className="ml-3">{item.title}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <Link href="/auth/logout">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sign Out
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Mobile navigation toggle */}
                        <div className="md:hidden mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        {session.user.image ? (
                                            <img
                                                src={session.user.image}
                                                alt={session.user.name || "User"}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{session.user.name}</p>
                                        <p className="text-sm text-gray-500">{session.user.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                                >
                                    {isMobileNavOpen ? "Hide Menu" : "Show Menu"}
                                </Button>
                            </div>

                            {isMobileNavOpen && (
                                <nav className="mt-4 flex flex-col space-y-2">
                                    {navigationItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`
                          flex items-center px-3 py-2 rounded-md text-sm
                          ${isActive
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                        `}
                                                onClick={() => setIsMobileNavOpen(false)}
                                            >
                                                {item.icon}
                                                <span className="ml-3">{item.title}</span>
                                            </Link>
                                        );
                                    })}

                                    <Link
                                        href="/auth/logout"
                                        className="flex items-center px-3 py-2 mt-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                                        onClick={() => setIsMobileNavOpen(false)}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="ml-3">Sign Out</span>
                                    </Link>
                                </nav>
                            )}
                        </div>

                        {/* Main content */}
                        <div className="flex-1">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[60vh]">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null; // Return null while redirecting
}