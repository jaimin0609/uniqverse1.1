"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, User, Search, ChevronDown, Heart, Settings, ShoppingCart, Loader2 } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CurrencySelector } from "@/components/layout/currency-selector";
import { formatCurrency } from "@/utils/format";

export function Header() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debug session information
    console.log("Header session data:", session);

    // Normalize role check to match Prisma UserRole enum (ADMIN not admin)
    const isAdmin = session?.user?.role === 'ADMIN'; const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };    // Add keyboard listener for search shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // If Escape key is pressed and search overlay is open, close it
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }

            // If "/" key is pressed outside of an input element and search is closed, open it
            if (e.key === '/' && !isSearchOpen &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsSearchOpen(true);
            }

            // Arrow key navigation for suggestions (only when search overlay is open)
            if (isSearchOpen && suggestions.length > 0) {
                const suggestionsElements = document.querySelectorAll('.search-suggestion-item');
                const currentIndex = Array.from(suggestionsElements).findIndex(
                    (el) => el === document.activeElement
                );

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    // Move focus to the first suggestion if no suggestion is focused,
                    // otherwise move to the next suggestion
                    const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, suggestionsElements.length - 1);
                    (suggestionsElements[nextIndex] as HTMLElement)?.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    // Move focus to the last suggestion if no suggestion is focused,
                    // otherwise move to the previous suggestion
                    const prevIndex = currentIndex === -1 ? suggestionsElements.length - 1 : Math.max(currentIndex - 1, 0);
                    (suggestionsElements[prevIndex] as HTMLElement)?.focus();
                } else if (e.key === 'Enter' && currentIndex !== -1) {
                    e.preventDefault();
                    // Trigger click on the focused suggestion
                    (suggestionsElements[currentIndex] as HTMLElement).click();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isSearchOpen, suggestions.length]); const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setSearchTerm(""); // Reset search term when opening the search overlay
            setSuggestions([]); // Clear suggestions when opening the search overlay
        }
    };

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };    // Debounced search function to fetch suggestions    // Create a search cache to store previous results
    const searchCacheRef = useRef<Record<string, any[]>>({});

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const normalizedQuery = query.trim().toLowerCase();

        // Check if we have cached results for this exact query
        if (searchCacheRef.current[normalizedQuery]) {
            setSuggestions(searchCacheRef.current[normalizedQuery]);
            return;
        }

        try {
            setIsLoading(true);
            const apiUrl = `/api/products/search-new?query=${encodeURIComponent(normalizedQuery)}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const results = data.suggestions || [];

                // Cache the results for future use
                searchCacheRef.current[normalizedQuery] = results;

                // Limit cache size to prevent memory issues
                const cacheKeys = Object.keys(searchCacheRef.current);
                if (cacheKeys.length > 20) {
                    delete searchCacheRef.current[cacheKeys[0]];
                }

                setSuggestions(results);
            } else {
                console.error('Search API error:', response.status);
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);// Update search term and trigger debounced API call with a shorter delay
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Clear any existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set a new debounce timer with an extremely short delay for near-instant response
        if (value.trim().length >= 2) {
            setIsLoading(true); // Show loading state immediately
            debounceTimerRef.current = setTimeout(() => {
                fetchSuggestions(value);
            }, 100); // 100ms debounce - very fast response while still reducing API calls
        } else {
            // Clear suggestions if query is too short
            setSuggestions([]);
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            // Close the search overlay
            setIsSearchOpen(false);
            // Navigate to shop page with search parameter
            router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
            // Clear suggestions
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (slug: string) => {
        setIsSearchOpen(false);
        setSuggestions([]);
        router.push(`/products/${slug}`);
    };

    // Define navigation links
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        {
            name: "Categories",
            href: "#",
            children: [
                { name: "All Categories", href: "/categories" },
                { name: "Featured", href: "/shop/featured" },
                { name: "New Arrivals", href: "/shop/new" },
            ]
        },
        { name: "About", href: "/about" },
        { name: "Support", href: "/support" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                UniQVerse
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-6">
                        {navLinks.map((link) => (
                            link.children ? (
                                <div key={link.name} className="relative group">
                                    <button className={`flex items-center text-slate-600 dark:text-slate-300 hover:text-primary px-2 py-1 rounded-md text-sm font-medium ${pathname === link.href ? "text-primary" : ""}`}>
                                        {link.name}
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    </button>
                                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-slate-200 dark:border-slate-700">
                                        {link.children.map((childLink) => (
                                            <Link
                                                key={childLink.name}
                                                href={childLink.href}
                                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                {childLink.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`text-slate-600 dark:text-slate-300 hover:text-primary px-2 py-1 rounded-md text-sm font-medium ${pathname === link.href ? "text-primary" : ""}`}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Right side - Search, Settings (Theme + Currency), User actions (Wishlist + Account) */}
                    <div className="flex items-center space-x-2">                        {/* Search Button */}
                        <div className="relative group">
                            <button
                                onClick={toggleSearch}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary focus:outline-none"
                                aria-label="Search"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            <div className="absolute hidden group-hover:block -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap">
                                Search <span className="px-1 py-0.5 bg-slate-700 rounded text-xs">/</span>
                            </div>
                        </div>

                        {/* Settings Dropdown (Theme + Currency) */}
                        <div className="relative">
                            <button
                                onClick={toggleSettings}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary focus:outline-none"
                                aria-label="Settings"
                            >
                                <Settings className="h-5 w-5" />
                            </button>

                            {isSettingsOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={toggleSettings}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg py-2 z-50 border border-slate-200 dark:border-slate-700">
                                        <div className="px-4 py-2">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Theme</p>
                                            <ThemeToggle />
                                        </div>
                                        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                        <div className="px-4 py-2">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Currency</p>
                                            <CurrencySelector />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Cart Button */}
                        <CartButton />

                        {/* User Actions (Account/Wishlist) */}
                        {session ? (
                            <div className="relative group">
                                <button className="flex items-center space-x-1 p-2 text-slate-600 dark:text-slate-300 hover:text-primary focus:outline-none">
                                    <User className="h-5 w-5" />
                                    <span className="hidden lg:inline-block text-sm font-medium">
                                        {session.user?.name?.split(' ')[0] || 'Account'}
                                    </span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-slate-200 dark:border-slate-700">
                                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                                        <p className="font-medium truncate">{session.user?.email}</p>
                                    </div>

                                    <Link href="/account" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        My Account
                                    </Link>
                                    <Link href="/account/orders" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        Orders
                                    </Link>
                                    <Link href="/account/wishlist" className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Heart className="h-4 w-4 mr-2" /> Wishlist
                                    </Link>

                                    {/* Show Admin Dashboard link only for admin users */}
                                    {isAdmin && (
                                        <Link href="/admin" className="block px-4 py-2 text-sm text-primary font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                            Admin Dashboard
                                        </Link>
                                    )}

                                    <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                    <Link href="/api/auth/signout" className="block px-4 py-2 text-sm text-destructive hover:bg-slate-100 dark:hover:bg-slate-800">
                                        Sign out
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth/login">
                                <Button variant="outline" size="sm" className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-primary focus:outline-none"
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            >
                                {isMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu - improved organization */}
                {
                    isMenuOpen && (
                        <div className="md:hidden">
                            <div className="px-2 pt-2 pb-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="py-2">
                                    <div className="font-medium px-3 py-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        Main Navigation
                                    </div>

                                    {navLinks.map((link) => (
                                        link.children ? (
                                            <div key={link.name} className="py-1">
                                                <div className="font-medium px-3 py-2 text-slate-900 dark:text-white">
                                                    {link.name}
                                                </div>
                                                <div className="pl-4 space-y-1">
                                                    {link.children.map((childLink) => (
                                                        <Link
                                                            key={childLink.name}
                                                            href={childLink.href}
                                                            onClick={closeMenu}
                                                            className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname === childLink.href ? "text-primary bg-blue-50 dark:bg-blue-900/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                                        >
                                                            {childLink.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <Link
                                                key={link.name}
                                                href={link.href}
                                                onClick={closeMenu}
                                                className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname === link.href ? "text-primary bg-blue-50 dark:bg-blue-900/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                            >
                                                {link.name}
                                            </Link>
                                        )
                                    ))}
                                </div>

                                <div className="py-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="font-medium px-3 py-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        Settings
                                    </div>

                                    {/* Theme toggle in mobile menu */}
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">Theme</span>
                                        <ThemeToggle />
                                    </div>

                                    {/* Currency selector in mobile menu */}
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">Currency</span>
                                        <CurrencySelector />
                                    </div>
                                </div>

                                <div className="py-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="font-medium px-3 py-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        Account
                                    </div>

                                    {/* Wishlist link in mobile menu */}
                                    <Link
                                        href="/account/wishlist"
                                        onClick={closeMenu}
                                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Heart className="h-5 w-5 mr-2" />
                                        Wishlist
                                    </Link>

                                    {/* Add Admin Dashboard link for admin users in mobile menu */}
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={closeMenu}
                                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        >
                                            <User className="h-5 w-5 mr-2" />
                                            Admin Dashboard
                                        </Link>
                                    )}

                                    {session ? (
                                        <Link
                                            href="/api/auth/signout"
                                            onClick={closeMenu}
                                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <X className="h-5 w-5 mr-2" />
                                            Sign out
                                        </Link>
                                    ) : (
                                        <div className="space-y-1">
                                            <Link
                                                href="/auth/login"
                                                onClick={closeMenu}
                                                className="block px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                Sign in
                                            </Link>
                                            <Link
                                                href="/auth/register"
                                                onClick={closeMenu}
                                                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                Register
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }                {/* Search overlay */}
                {
                    isSearchOpen && (
                        <div className="absolute inset-0 z-50">
                            <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm" onClick={toggleSearch}></div>
                            <div className="relative bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="container mx-auto">
                                    <form onSubmit={handleSearch} className="flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="flex-grow p-2 border border-slate-300 dark:border-slate-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            autoFocus
                                        />
                                        <Button type="submit" className="rounded-l-none">
                                            <Search className="h-5 w-5 mr-2" />
                                            Search
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={toggleSearch}
                                            className="ml-4 p-2 text-slate-600 dark:text-slate-300 hover:text-destructive"
                                            aria-label="Close search"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </form>                                    {/* Search suggestions */}
                                    {searchTerm.length > 0 && (
                                        <div className="mt-3">
                                            {isLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                </div>
                                            ) : suggestions && suggestions.length > 0 ? (
                                                <div className="bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 mt-2 max-h-80 overflow-y-auto">
                                                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                                                        <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400">
                                                            Suggestions ({suggestions.length})
                                                        </h3>
                                                    </div>
                                                    <ul>
                                                        {suggestions.map((suggestion) => (
                                                            <li
                                                                key={suggestion.id}
                                                                className="search-suggestion-item hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                                onClick={() => handleSuggestionClick(suggestion.slug)}
                                                                tabIndex={0}
                                                            >
                                                                <div className="p-2 flex items-center gap-3">
                                                                    {suggestion.image && (
                                                                        <div className="w-10 h-10 flex-shrink-0">
                                                                            <Image
                                                                                src={suggestion.image}
                                                                                alt={suggestion.name || 'Product image'}
                                                                                width={40}
                                                                                height={40}
                                                                                className="object-cover rounded"
                                                                                onError={(e) => {
                                                                                    // Fallback for image errors
                                                                                    e.currentTarget.src = '/images/placeholder-image.svg';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-grow">
                                                                        <p className="font-medium text-slate-900 dark:text-white">{suggestion.name}</p>
                                                                        <div className="flex justify-between">
                                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                                {suggestion.category || 'Uncategorized'}
                                                                            </p>
                                                                            <p className="text-sm font-medium text-primary">
                                                                                {formatCurrency(suggestion.price || 0)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    {searchTerm.length >= 2 ? (
                                                        <div>No products found. Press Enter or click Search to find "{searchTerm}"</div>
                                                    ) : (
                                                        <div>Type at least 2 characters to search</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </header>
    );
}
