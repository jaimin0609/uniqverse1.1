"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    FileText,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    LogOut,
    MessageSquare,
    Truck, // Add Truck icon for dropshipping
    Tag, // Add Tag icon for promotions
    HomeIcon, // Add Home icon
    Mail, // Add Mail icon for newsletter
    Activity, // Add Activity icon for performance
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleLogout } from '@/utils/logout-utils';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    subItems?: { title: string; href: string }[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSubMenu = (title: string) => {
        setOpenSubMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const navigationItems: NavItem[] = [
        {
            title: "Dashboard",
            href: "/admin",
            icon: <LayoutDashboard className="h-5 w-5" />
        }, {
            title: "Products",
            href: "/admin/products",
            icon: <Package className="h-5 w-5" />,
            subItems: [
                { title: "All Products", href: "/admin/products" },
                { title: "Add New", href: "/admin/products/create" },
                { title: "Categories", href: "/admin/categories" }
            ]
        },
        {
            title: "Orders",
            href: "/admin/orders",
            icon: <ShoppingCart className="h-5 w-5" />
        },
        {
            title: "Dropshipping",
            href: "/admin/dropshipping",
            icon: <Truck className="h-5 w-5" />,
            subItems: [
                { title: "Dashboard", href: "/admin/dropshipping" },
                { title: "Import Products", href: "/admin/dropshipping/import" },
                { title: "Supplier Orders", href: "/admin/dropshipping/supplier-orders" },
                { title: "Suppliers", href: "/admin/suppliers" },
                { title: "Settings", href: "/admin/dropshipping/settings" }
            ]
        },        {
            title: "Customers",
            href: "/admin/customers",
            icon: <Users className="h-5 w-5" />
        }, {
            title: "Vendor Applications",
            href: "/admin/vendor-applications",
            icon: <Users className="h-5 w-5" />
        },
        {
            title: "Commissions",
            href: "/admin/commissions",
            icon: <Activity className="h-5 w-5" />
        },
        {
            title: "Jobs",
            href: "/admin/jobs",
            icon: <Users className="h-5 w-5" />,
            subItems: [
                { title: "Job Positions", href: "/admin/jobs" },
                { title: "Applications", href: "/admin/jobs/applications" }
            ]
        },
        {
            title: "Newsletter",
            href: "/admin/newsletter",
            icon: <Mail className="h-5 w-5" />
        },
        {
            title: "Support",
            href: "/admin/support-management",
            icon: <MessageSquare className="h-5 w-5" />,
            subItems: [
                { title: "Support Management", href: "/admin/support-management" },
                { title: "Chatbot Settings", href: "/admin/support-management/chatbot" }
            ]
        }, {
            title: "Content",
            href: "/admin/content",
            icon: <FileText className="h-5 w-5" />,
            subItems: [
                { title: "Pages", href: "/admin/content/pages" },
                { title: "Blog Posts", href: "/admin/content/blog" },
                { title: "Blog Categories", href: "/admin/content/blog-categories" }
            ]
        },
        {
            title: "Promotions",
            href: "/admin/promotions",
            icon: <Tag className="h-5 w-5" />,
            subItems: [
                { title: "All Promotions", href: "/admin/promotions" },
                { title: "Coupons", href: "/admin/promotions/coupons" },
                { title: "Events", href: "/admin/events" }
            ]
        }, {
            title: "Performance",
            href: "/admin/performance",
            icon: <Activity className="h-5 w-5" />,
            subItems: [
                { title: "Performance Dashboard", href: "/admin/performance" },
                { title: "Memory Leaks", href: "/admin/memory-leaks" }
            ]
        },
        {
            title: "Settings",
            href: "/admin/settings",
            icon: <Settings className="h-5 w-5" />
        },
        {
            title: "Home",
            href: "/",
            icon: <HomeIcon className="h-5 w-5" />
        }
    ];

    // Admin layout - authentication is now handled by middleware
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Mobile sidebar toggle */}
            <div className="fixed top-0 left-0 z-40 w-full bg-white md:hidden p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="font-bold text-lg">Uniqverse Admin</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                    >
                        {isMobileOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-0 z-30 flex h-screen w-64 flex-col overflow-y-auto bg-white shadow-sm 
                    transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <Link href="/admin" className="font-bold text-xl">
                        Uniqverse Admin
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 px-3 py-4">
                    <nav className="flex flex-col space-y-1">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href || (item.subItems && item.subItems.some(subItem => pathname === subItem.href));

                            return (
                                <div key={item.title}>
                                    {item.subItems ? (
                                        <>
                                            <button
                                                onClick={() => toggleSubMenu(item.title)}
                                                className={`
                                                    flex items-center justify-between w-full px-3 py-2 rounded-md text-sm
                                                    ${isActive ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                                `}
                                            >
                                                <div className="flex items-center">
                                                    {item.icon}
                                                    <span className="ml-3">{item.title}</span>
                                                </div>
                                                {openSubMenus[item.title] ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </button>

                                            {openSubMenus[item.title] && (
                                                <div className="mt-1 ml-4 pl-2 border-l border-gray-200">
                                                    {item.subItems.map((subItem) => {
                                                        const isSubItemActive = pathname === subItem.href;

                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={`
                                                                    flex items-center px-3 py-2 rounded-md text-sm
                                                                    ${isSubItemActive ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                                                `}
                                                                onClick={() => setIsMobileOpen(false)}
                                                            >
                                                                <span className="ml-3">{subItem.title}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`
                                                flex items-center px-3 py-2 rounded-md text-sm
                                                ${isActive ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                            `}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            {item.icon}
                                            <span className="ml-3">{item.title}</span>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500">{session?.user?.email}</p>
                        </div>
                    </div>                    <div className="mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-700"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                            data-testid="admin-logout-button"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col md:pl-0 pt-16 md:pt-0 w-full overflow-x-hidden">
                <div className="mx-auto w-full max-w-7xl p-4 md:p-6 pb-16">
                    {/* Removed flex-1 to prevent stretching and added pb-16 for bottom padding */}
                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}