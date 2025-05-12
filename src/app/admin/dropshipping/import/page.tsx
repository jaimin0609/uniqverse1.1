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

    // Add rate limit state
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
    const [rateLimitMessage, setRateLimitMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

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

            if (data.suppliers) {
                // Filter for CJ Dropshipping suppliers only
                const cjSuppliers = data.suppliers.filter(
                    (s: any) => s.apiEndpoint && s.apiEndpoint.includes('cjdropshipping')
                );
                setSuppliers(cjSuppliers);

                if (cjSuppliers.length > 0) {
                    setSupplierId(cjSuppliers[0].id);
                }
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
    };

    // Import a product
    const importProduct = async (product: CJProduct) => {
        if (!selectedStoreCategory) {
            toast.error("Please select a store category first");
            return;
        }

        setImportingProduct(product.pid);

        try {
            const response = await fetch('/api/admin/suppliers/cj-dropshipping/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    supplierId,
                    productId: product.pid,
                    categoryId: selectedStoreCategory,
                    markup: markup / 100, // Convert percentage to decimal
                }),
            });

            const data = await response.json();
            console.log('Import response:', data);

            if (response.status === 429) {
                setIsRateLimited(true);
                setRateLimitSeconds(data.rateLimitSeconds || 300);
                setRateLimitMessage(data.rateLimitMessage || "Rate limit reached. Please try again later.");
                setCountdown(data.rateLimitSeconds || 300);
                toast.error(data.rateLimitMessage || "Rate limit reached");
                return;
            }

            if (data.success) {
                toast.success(`Product "${product.productNameEn}" imported successfully`);

                // Navigate to the product edit page with the correct route
                if (data.product && data.product.id) {
                    router.push(`/admin/products/${data.product.id}/edit`);
                } else {
                    // If no specific product data is returned, go to the products list
                    router.push('/admin/products');
                }
            } else {
                toast.error(data.error || "Failed to import product");
                if (data.details) {
                    console.error("Import failure details:", data.details);
                    toast.error(data.details);
                }
            }
        } catch (error) {
            console.error("Error importing product:", error);
            toast.error("Failed to import product: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setImportingProduct(null);
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
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !supplierId || isRateLimited}
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
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" /> Search
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="mb-2 text-sm font-medium">CJ Product Category</p>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
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
                        <CardHeader className="pb-2">
                            <CardTitle>Search Results</CardTitle>
                            <CardDescription>
                                Found {products.length} products. Click "Import" to add a product to your store.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
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
                                            <TableRow key={product.pid}>
                                                <TableCell>
                                                    {product.productImage && (
                                                        <div className="relative w-16 h-16 overflow-hidden rounded border">                                                            <Image
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
                                                            !selectedStoreCategory
                                                        }
                                                    >
                                                        {importingProduct === product.pid ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
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
            )}
        </div>
    );
}