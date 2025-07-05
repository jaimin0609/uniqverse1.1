"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    Settings,
    Menu,
    X,
    User,
    LogOut,
    Home,
    Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface VendorLayoutProps {
    children: React.ReactNode;
}

const navigation = [
    {
        name: "Dashboard",
        href: "/vendor",
        icon: LayoutDashboard,
        current: false,
    },
    {
        name: "Products",
        href: "/vendor/products",
        icon: Package,
        current: false,
    },
    {
        name: "Orders",
        href: "/vendor/orders",
        icon: ShoppingCart,
        current: false,
    }, {
        name: "Analytics",
        href: "/vendor/analytics",
        icon: BarChart3,
        current: false,
    },
    {
        name: "Plans",
        href: "/vendor/plans",
        icon: Store,
        current: false,
    },
    {
        name: "Settings",
        href: "/vendor/settings",
        icon: Settings,
        current: false,
    },
];

export default function VendorLayout({ children }: VendorLayoutProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Redirect if not vendor
    useEffect(() => {
        if (status !== "loading" && (!session?.user || session.user.role !== "VENDOR")) {
            router.push("/");
        }
    }, [session, status, router]);

    // Show loading state
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!session?.user || session.user.role !== "VENDOR") {
        return null;
    }

    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: "/" });
        } catch (error) {
            console.error("Error signing out:", error);
            toast.error("Failed to sign out");
        }
    };    // Update current navigation item
    const updatedNavigation = navigation.map(item => ({
        ...item,
        current: pathname === item.href || (item.href !== "/vendor" && pathname?.startsWith(item.href))
    }));

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile menu */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 items-center justify-between px-6 border-b">
                        <h1 className="text-xl font-semibold text-gray-900">Vendor Portal</h1>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {updatedNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${item.current
                                        ? "bg-blue-100 text-blue-900"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.current ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                                        }`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
                    <div className="flex h-16 items-center justify-between px-6 border-b">
                        <h1 className="text-xl font-semibold text-gray-900">Vendor Portal</h1>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 px-3 py-4">
                            {updatedNavigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${item.current
                                            ? "bg-blue-100 text-blue-900"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.current ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                                            }`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Quick links */}
                        <div className="border-t border-gray-200 p-3">
                            <div className="space-y-1">
                                <Link
                                    href="/"
                                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                                >
                                    <Home className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                                    Visit Store
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top navigation */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Separator */}
                    <div className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="relative flex flex-1 items-center">
                            <span className="text-sm text-gray-500">
                                Logged in as <span className="font-medium text-gray-900">Vendor</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Profile dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {session.user.name}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/vendor/settings">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/">
                                            <Store className="mr-2 h-4 w-4" />
                                            Visit Store
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
