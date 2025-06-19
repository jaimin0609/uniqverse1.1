"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Search,
    Filter,
    Download,
    Tag,
    DollarSign,
    Package,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Check,
    AlertCircle,
    Clock,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/badge";
import { ProxyImage } from "@/components/ui/proxy-image";

interface CJProduct {
    pid: string;
    productNameEn: string;
    productImage: string;
    sellPrice: number;
    shippingTime?: string;
    variants?: any[];
    isImported?: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function ImportCJProductsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<CJProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [storeCategories, setStoreCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStoreCategory, setSelectedStoreCategory] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [supplierId, setSupplierId] = useState("");
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [markup, setMarkup] = useState(30); // Default 30% markup
    const [importingProduct, setImportingProduct] = useState<string | null>(null);

    // Added bulk import state
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkImportResults, setBulkImportResults] = useState<any[]>([]);
    const [showBulkResults, setShowBulkResults] = useState(false);

    // Add rate limit state
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
    const [rateLimitMessage, setRateLimitMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

    // Add confirmation state
    const [showConfirm, setShowConfirm] = useState(false);

    // API Status checking
    const [apiStatus, setApiStatus] = useState<'unknown' | 'ready' | 'rate_limited' | 'error'>('unknown');
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Request debouncing to prevent rapid API calls
    const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

    const debounceApiCall = (key: string, callback: () => Promise<void>, delay: number = 1000) => {
        if (pendingRequests.has(key)) {
            console.log(`Request ${key} already pending, skipping`);
            return;
        }

        setPendingRequests(prev => new Set(prev).add(key));

        setTimeout(async () => {
            try {
                await callback();
            } finally {
                setPendingRequests(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                });
            }
        }, delay);
    };

    // Get suppliers on initial load
    useEffect(() => {
        fetchSuppliers();
        fetchStoreCategories();
    }, []);

    // Handle countdown for rate limit
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && isRateLimited) {
            setIsRateLimited(false);
        }
    }, [countdown, isRateLimited]);

    // Fetch suppliers from the API
    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/admin/suppliers');
            const data = await response.json();

            if (data && data.suppliers && Array.isArray(data.suppliers)) {
                // Filter for CJ Dropshipping suppliers only
                const cjSuppliers = data.suppliers.filter(
                    (s: any) => s.apiEndpoint && s.apiEndpoint.includes('cjdropshipping')
                );
                setSuppliers(cjSuppliers);                // Don't automatically select supplier to avoid automatic API calls
                // User should manually select supplier to prevent rate limiting
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        }
    };

    // Fetch store categories
    const fetchStoreCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories');
            const data = await response.json();

            if (data.categories) {
                setStoreCategories(data.categories);

                if (data.categories.length > 0) {
                    setSelectedStoreCategory(data.categories[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching store categories:", error);
            toast.error("Failed to load store categories");
        }
    };

    // Fetch supplier categories from CJ Dropshipping
    const fetchSupplierCategories = async () => {
        if (!supplierId) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/suppliers/cj-dropshipping/categories?supplierId=${supplierId}`);

            // Check for rate limit
            if (!response.ok && response.status === 429) {
                const data = await response.json();
                setIsRateLimited(true);
                setRateLimitSeconds(data.rateLimitSeconds || 300);
                setRateLimitMessage(data.rateLimitMessage || "Rate limit reached. Please try again later.");
                setCountdown(data.rateLimitSeconds || 300);
                toast.error(data.rateLimitMessage || "Rate limit reached");
                return;
            }

            const data = await response.json();

            if (data.success && data.categories) {
                setCategories(data.categories);
            } else {
                toast.error(data.error || "Failed to load supplier categories");
            }
        } catch (error) {
            console.error("Error fetching supplier categories:", error);
            toast.error("Failed to load supplier categories");
        } finally {
            setIsLoading(false);
        }
    };    // Effect to fetch categories when supplier changes (but only if manually triggered)
    useEffect(() => {
        // Reset categories when supplier changes to ensure clean state
        if (supplierId) {
            setCategories([]);
            setSelectedCategory("all");
        }
    }, [supplierId]);

    // Check API status
    const checkApiStatus = async () => {
        if (!supplierId) return;

        try {
            const response = await fetch(`/api/admin/suppliers/cj-dropshipping/status?supplierId=${supplierId}`);
            const data = await response.json();

            if (data.success) {
                setApiStatus(data.status);
                if (data.status === 'rate_limited') {
                    setStatusMessage(`Rate limited: ${data.reason}. Wait ${data.waitTime} seconds.`);
                } else {
                    setStatusMessage('API ready for requests');
                }
            } else {
                setApiStatus('error');
                setStatusMessage(data.error || 'Failed to check API status');
            }
        } catch (error) {
            console.error("Error checking API status:", error);
            setApiStatus('error');
            setStatusMessage('Failed to check API status');
        }
    };

    // Auto-check status when supplier changes
    useEffect(() => {
        if (supplierId) {
            checkApiStatus();
            // Check status every 30 seconds
            const interval = setInterval(checkApiStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [supplierId]);

    // Search for products
    const searchProducts = async () => {
        if (!supplierId) {
            toast.error("Please select a supplier first");
            return;
        }

        setIsLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams({
                supplierId,
                page: currentPage.toString(),
                limit: "20",
            });

            if (searchTerm) {
                params.append("query", searchTerm);
            }

            if (selectedCategory && selectedCategory !== "all") {
                params.append("categoryId", selectedCategory);
            }

            // Make API call
            const response = await fetch(`/api/admin/suppliers/cj-dropshipping/search?${params.toString()}`);
            const data = await response.json();

            // Check for rate limit
            if (!response.ok && response.status === 429) {
                setIsRateLimited(true);
                setRateLimitSeconds(data.rateLimitSeconds || 300);
                setRateLimitMessage(data.rateLimitMessage || "Rate limit reached. Please try again later.");
                setCountdown(data.rateLimitSeconds || 300);
                toast.error(data.rateLimitMessage || "Rate limit reached");
                return;
            }

            if (data.success) {
                setProducts(data.products || []);
                setTotalPages(Math.ceil((data.total || 0) / 20));

                // Store categories if they exist
                if (data.categories && data.categories.length > 0) {
                    setCategories(data.categories);
                }
            } else {
                toast.error(data.error || "Failed to search products");
            }
        } catch (error) {
            console.error("Error searching products:", error);
            toast.error("Failed to search products");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        // Don't allow searching if rate limited
        if (isRateLimited) {
            toast.error(`Rate limit in effect. Please wait ${countdown} seconds.`);
            return;
        }

        setCurrentPage(1); // Reset to first page
        searchProducts();
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        searchProducts();
    };    // Handle importing a single product
    const importProduct = async (product: CJProduct) => {
        if (!selectedStoreCategory || !supplierId) {
            toast.error("Please select a supplier and store category");
            return;
        }

        setImportingProduct(product.pid);

        try {
            const response = await fetch("/api/admin/suppliers/cj-dropshipping/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" }, body: JSON.stringify({
                    supplierId,
                    productId: product.pid,
                    categoryId: selectedStoreCategory,
                    markup: markup / 100, // Convert percentage to decimal
                }),
            });

            // Handle rate limit
            if (!response.ok && response.status === 429) {
                const data = await response.json();
                setIsRateLimited(true);
                setRateLimitSeconds(data.rateLimitSeconds || 300);
                setRateLimitMessage(data.rateLimitMessage || "Rate limit reached. Please try again later.");
                setCountdown(data.rateLimitSeconds || 300);
                toast.error(data.rateLimitMessage || "Rate limit reached");
                return;
            }

            const data = await response.json();

            if (data.success) {
                toast.success(`Imported ${data.product.name} successfully!`);

                // Update the UI to show the product is imported
                setProducts((prevProducts) =>
                    prevProducts.map((p) =>
                        p.pid === product.pid
                            ? { ...p, isImported: true }
                            : p
                    )
                );                // Open the product edit page in a new tab instead of redirecting
                window.open(`/admin/products/${data.product.id}/edit`, '_blank');
            } else {
                toast.error(data.error || "Failed to import product");
            }
        } catch (error) {
            console.error("Error importing product:", error);
            toast.error("Failed to import product");
        } finally {
            setImportingProduct(null);
        }
    };

    // Toggle product selection for bulk import
    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    // Check if a product is selected for bulk import
    const isProductSelected = (productId: string) => {
        return selectedProducts.includes(productId);
    };    // Toggle selection for all products
    const toggleSelectAll = () => {
        if (selectedProducts.length === products.filter(p => !p.isImported).length) {
            setSelectedProducts([]);
        } else {
            // Only select products that haven't been imported yet
            setSelectedProducts(products.filter(p => !p.isImported).map(p => p.pid));
        }
    };

    // Confirm dialog for bulk import
    const confirmBulkImport = () => {
        if (selectedProducts.length === 0) {
            toast.error("Please select at least one product to import");
            return;
        }

        if (!selectedStoreCategory || !supplierId) {
            toast.error("Please select a supplier and store category");
            return;
        }

        // Show confirmation
        setShowConfirm(true);
    };

    // Handle bulk import
    const handleBulkImport = async () => {
        setShowConfirm(false);
        setIsBulkImporting(true);
        setBulkImportResults([]);

        try {
            const response = await fetch("/api/admin/suppliers/cj-dropshipping/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" }, body: JSON.stringify({
                    supplierId,
                    categoryId: selectedStoreCategory,
                    productIds: selectedProducts,
                    markup: markup / 100, // Convert percentage to decimal
                }),
            });

            // Handle rate limit
            if (!response.ok && response.status === 429) {
                const data = await response.json();
                setIsRateLimited(true);
                setRateLimitSeconds(data.rateLimitSeconds || 300);
                setRateLimitMessage(data.rateLimitMessage || "Rate limit reached. Please try again later.");
                setCountdown(data.rateLimitSeconds || 300);
                toast.error(data.rateLimitMessage || "Rate limit reached");
                return;
            }

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Products imported successfully");
                setBulkImportResults(data.results || []);
                setShowBulkResults(true);

                // Clear selections
                setSelectedProducts([]);
            } else {
                toast.error(data.error || "Failed to bulk import products");
            }
        } catch (error) {
            console.error("Error bulk importing products:", error);
            toast.error("Failed to bulk import products");
        } finally {
            setIsBulkImporting(false);
        }
    };

    // Format countdown time
    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title="Import CJ Dropshipping Products"
                description="Search and import products from CJ Dropshipping"
            />

            {/* API Rate Limit Information */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium">CJ Dropshipping API Information</h3>
                </div>
                <p className="mt-2 text-sm">
                    CJ Dropshipping has strict rate limits: authentication only once every 5 minutes, and 1-6 requests/second based on your account level.
                    Manually select supplier and load categories to avoid automatic API calls.
                </p>
            </div>

            {isRateLimited && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-amber-500" />
                        <h3 className="font-medium">CJ Dropshipping API Rate Limit</h3>
                    </div>
                    <p className="mt-2">{rateLimitMessage}</p>
                    <div className="mt-3 flex items-center text-sm font-mono bg-amber-100 text-amber-900 px-3 py-1 rounded-md inline-block">
                        <span>Time remaining: {formatCountdown(countdown)}</span>
                    </div>
                </div>)}

            {/* API Status Indicator */}
            {supplierId && apiStatus !== 'unknown' && (
                <div className={`mb-4 p-3 rounded-md border ${apiStatus === 'ready'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : apiStatus === 'rate_limited'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center">
                        {apiStatus === 'ready' ? (
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : apiStatus === 'rate_limited' ? (
                            <Clock className="h-4 w-4 mr-2" />
                        ) : (
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="text-sm font-medium">
                            API Status: {apiStatus === 'ready' ? 'Ready' : apiStatus === 'rate_limited' ? 'Rate Limited' : 'Error'}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-6 px-2"
                            onClick={checkApiStatus}
                            title="Refresh Status"
                        >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </Button>
                    </div>
                    <p className="mt-1 text-xs">{statusMessage}</p>
                </div>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Search Products</CardTitle>
                    <CardDescription>
                        Find products to import from CJ Dropshipping
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div>
                                <Select
                                    value={supplierId}
                                    onValueChange={setSupplierId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>                            <div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !supplierId || isRateLimited || apiStatus === 'rate_limited'}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                        </>
                                    ) : isRateLimited ? (
                                        <>
                                            <Clock className="mr-2 h-4 w-4" /> Rate Limited ({formatCountdown(countdown)})
                                        </>
                                    ) : apiStatus === 'rate_limited' ? (
                                        <>
                                            <Clock className="mr-2 h-4 w-4" /> API Rate Limited
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" /> Search Products (API Call)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                            <div>                                <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">CJ Product Category</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={fetchSupplierCategories}
                                disabled={isLoading || isRateLimited || !supplierId || apiStatus === 'rate_limited'}
                                title="Load Categories (makes API call)"
                            >
                                <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2v6h-6"></path>
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                    <path d="M3 22v-6h6"></path>
                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                                </svg>
                            </Button>
                        </div>
                            {categories.length === 0 && !isLoading && supplierId ? (
                                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                                    Click the refresh button above to load CJ categories (requires API call)
                                </div>
                            ) : null}
                            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading || categories.length === 0}>
                                <SelectTrigger>
                                    {isLoading && categories.length === 0 ? (
                                        <div className="flex items-center">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            <span>Loading categories...</span>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <SelectValue placeholder="Load categories first" />
                                    ) : (
                                        <SelectValue placeholder="All Categories" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                            <div>
                                <p className="mb-2 text-sm font-medium">Store Category</p>
                                <Select value={selectedStoreCategory} onValueChange={setSelectedStoreCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select store category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {storeCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium">Profit Markup: {markup}%</p>
                            <Slider
                                value={[markup]}
                                min={10}
                                max={200}
                                step={5}
                                onValueChange={(values) => setMarkup(values[0])}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>10%</span>
                                <span>50%</span>
                                <span>100%</span>
                                <span>150%</span>
                                <span>200%</span>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {products.length > 0 ? (
                <>
                    <Card>
                        <CardHeader className="pb-2">                            <CardTitle>Search Results</CardTitle>
                            <CardDescription>
                                Found {products.length} products. Select products and click "Import Selected" to bulk import, or import individually.
                            </CardDescription>
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center">                                    <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                                    checked={selectedProducts.length === products.filter(p => !p.isImported).length && products.filter(p => !p.isImported).length > 0}
                                    onChange={toggleSelectAll}
                                />
                                    <span className="text-sm">
                                        Select All ({selectedProducts.length} selected / {products.filter(p => !p.isImported).length} available)
                                    </span>
                                </div>
                                <Button
                                    onClick={confirmBulkImport}
                                    disabled={selectedProducts.length === 0 || isBulkImporting || isRateLimited}
                                    className="ml-auto"
                                >
                                    {isBulkImporting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Import Selected ({selectedProducts.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30px]"></TableHead>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Selling Price</TableHead>
                                            <TableHead>Shipping</TableHead>
                                            <TableHead>Variants</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                            <TableRow key={product.pid} className={product.isImported ? "bg-green-50" : ""}>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={isProductSelected(product.pid)}
                                                        onChange={() => toggleProductSelection(product.pid)}
                                                        disabled={product.isImported}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {product.productImage && (
                                                        <div className="relative w-16 h-16 overflow-hidden rounded border">
                                                            <Image
                                                                src={`/api/image-proxy?url=${encodeURIComponent(product.productImage)}`}
                                                                alt={product.productNameEn}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, 64px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium max-w-xs truncate">
                                                    {product.productNameEn}
                                                    {product.isImported && (
                                                        <Badge className="ml-2 bg-green-500">Imported</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    ${typeof product.sellPrice === 'number'
                                                        ? product.sellPrice.toFixed(2)
                                                        : '0.00'}
                                                </TableCell>
                                                <TableCell>
                                                    ${typeof product.sellPrice === 'number'
                                                        ? (product.sellPrice * (1 + markup / 100)).toFixed(2)
                                                        : '0.00'}
                                                    <div className="text-xs text-green-600">
                                                        Profit: ${typeof product.sellPrice === 'number'
                                                            ? (product.sellPrice * markup / 100).toFixed(2)
                                                            : '0.00'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {product.shippingTime || "7-14 days"}
                                                </TableCell>
                                                <TableCell>
                                                    {product.variants && product.variants.length > 0 ? (
                                                        <Badge>{product.variants.length} variants</Badge>
                                                    ) : (
                                                        <span className="text-gray-500">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => importProduct(product)}
                                                        disabled={
                                                            importingProduct === product.pid ||
                                                            !selectedStoreCategory ||
                                                            product.isImported ||
                                                            isRateLimited
                                                        }
                                                    >
                                                        {importingProduct === product.pid ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                                                            </>
                                                        ) : product.isImported ? (
                                                            <>
                                                                <Check className="mr-2 h-4 w-4" /> Imported
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="mr-2 h-4 w-4" /> Import
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <div className="flex justify-center mt-6">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isLoading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium">Searching for products...</h3>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Package className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No products found</h3>
                            <p className="text-gray-500 max-w-md">
                                Try adjusting your search terms or select a different category to find products from CJ Dropshipping.
                            </p>
                        </div>
                    )}
                </div>
            )}            {/* Bulk Import Results Section */}
            {showBulkResults && bulkImportResults.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Bulk Import Results</CardTitle>
                        <CardDescription>
                            Results of the bulk import operation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-gray-50 rounded-md border">
                            <h4 className="text-sm font-medium mb-2">Import Results</h4>
                            <ul className="space-y-2">
                                {bulkImportResults.map((result) => (
                                    <li
                                        key={result.productId}
                                        className={`text-sm ${result.success
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}
                                    >
                                        {result.success ? (
                                            <>
                                                <Check className="inline h-4 w-4 mr-1" />
                                                {result.productName || result.productId} was imported successfully
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                                {result.productId}: {result.error || "Import failed"}
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog for Bulk Import */}            {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirm(false)}></div>
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative z-10">
                        <h3 className="text-lg font-medium mb-4">Confirm Bulk Import</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to import {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} with {markup}% markup?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBulkImport}
                                className="bg-primary text-white"
                            >
                                Confirm Import
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing overlay */}
            {isBulkImporting && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="fixed inset-0 bg-black/30"></div>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full relative z-10 flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <h3 className="text-lg font-medium mb-2">Processing Import</h3>
                        <p className="text-sm text-gray-500 text-center">
                            Please wait while we import your selected products. This may take a few minutes.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}