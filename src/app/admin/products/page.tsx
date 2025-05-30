"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClientPrice } from "@/components/ui/client-price";
import {
    Search,
    Plus,
    Filter,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    Eye,
    Package,
    Check,
    Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    inventory: number;
    category: {
        name: string;
        slug: string;
    };
    isPublished: boolean;
    isFeatured: boolean;
    createdAt: string;
}

interface Category {
    name: string;
    slug: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [showFilters, setShowFilters] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Bulk selection state
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const perPage = 10;

    // Fetch products when component mounts or filters change
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Build query string with all filters
                const queryParams = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: perPage.toString(),
                    sort: sortField,
                    order: sortDirection,
                });

                if (searchTerm) {
                    queryParams.append('search', searchTerm);
                }

                if (categoryFilter) {
                    queryParams.append('category', categoryFilter);
                }

                if (statusFilter) {
                    queryParams.append('status', statusFilter);
                }

                // Fetch products from API
                const response = await fetch(`/api/admin/products?${queryParams.toString()}`);

                if (!response.ok) {
                    throw new Error(`Error fetching products: ${response.statusText}`);
                }

                const data = await response.json(); setProducts(data.products);
                setTotalPages(data.pagination.totalPages);

                // Reset selections when data changes
                setSelectedProducts(new Set());
                setIsSelectAll(false);

                // Fetch categories if not already loaded
                if (categories.length === 0) {
                    await fetchCategories();
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching products:", error);
                setError("Failed to fetch products. Please try again later.");
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [searchTerm, categoryFilter, statusFilter, sortField, sortDirection, currentPage]);

    // Fetch categories 
    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories');

            if (!response.ok) {
                throw new Error(`Error fetching categories: ${response.statusText}`);
            }

            const data = await response.json();

            // Add "All Categories" option
            const allCategories = [
                { name: "All Categories", slug: "" },
                ...data.categories
            ];

            setCategories(allCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to mock categories
            const mockCategories = [
                { name: "All Categories", slug: "" },
                { name: "Electronics", slug: "electronics" },
                { name: "Furniture", slug: "furniture" },
                { name: "Home", slug: "home" },
                { name: "Clothing", slug: "clothing" }
            ];
            setCategories(mockCategories);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Reset to first page when searching
        setCurrentPage(1);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }

        // Reset to first page when sorting
        setCurrentPage(1);
    };

    const renderSortArrow = (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4" />
        );
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }; const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error deleting product: ${response.statusText}`);
            }

            // Remove the deleted product from the list
            setProducts(products.filter(p => p.id !== productId));

            // Show success message
            alert("Product deleted successfully");
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Bulk selection handlers
    const handleSelectProduct = (productId: string, checked: boolean) => {
        const newSelection = new Set(selectedProducts);
        if (checked) {
            newSelection.add(productId);
        } else {
            newSelection.delete(productId);
        }
        setSelectedProducts(newSelection);

        // Update select all state
        setIsSelectAll(newSelection.size === products.length && products.length > 0);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allProductIds = new Set(products.map(p => p.id));
            setSelectedProducts(allProductIds);
            setIsSelectAll(true);
        } else {
            setSelectedProducts(new Set());
            setIsSelectAll(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedProducts.size} selected product(s)? This action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setIsBulkDeleting(true);
            const productIds = Array.from(selectedProducts);

            const response = await fetch('/api/admin/products/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete products');
            }

            // Remove deleted products from the list
            const deletedIds = productIds.filter(id => !result.failedDeletes?.includes(id));
            setProducts(products.filter(p => !deletedIds.includes(p.id)));

            // Clear selection
            setSelectedProducts(new Set());
            setIsSelectAll(false);

            // Show success/warning message
            let message = result.message;
            if (result.warning) {
                message += `\n${result.warning}`;
            }
            if (result.error) {
                message += `\nWarning: ${result.error}`;
            }

            alert(message);
        } catch (error) {
            console.error("Error bulk deleting products:", error);
            alert("Failed to delete products. Please try again.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <Button asChild className="mt-3 sm:mt-0">
                    <Link href="/admin/products/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <form onSubmit={handleSearch} className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                            {showFilters ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                            ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                >
                                    <option value="">All Categories</option>
                                    {categories.slice(1).map((cat: Category) => (
                                        <option key={cat.slug} value={cat.slug}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="featured">Featured</option>
                                </select>
                            </div>
                        </div>
                    </div>)}
            </div>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedProducts.size} product(s) selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedProducts(new Set());
                                    setIsSelectAll(false);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Clear Selection
                            </Button>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="flex items-center"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelectAll}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('name')}
                                                className="flex items-center focus:outline-none"
                                            >
                                                Product {renderSortArrow('name')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('category')}
                                                className="flex items-center focus:outline-none"
                                            >
                                                Category {renderSortArrow('category')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('price')}
                                                className="flex items-center focus:outline-none"
                                            >
                                                Price {renderSortArrow('price')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('inventory')}
                                                className="flex items-center focus:outline-none"
                                            >
                                                Inventory {renderSortArrow('inventory')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap w-12">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.has(product.id)}
                                                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                                                        {product.images && product.images.length > 0 ? (
                                                            <div className="relative h-10 w-10">
                                                                <Image
                                                                    src={product.images[0]}
                                                                    alt={product.name}
                                                                    fill
                                                                    sizes="40px"
                                                                    style={{ objectFit: "cover" }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-10 w-10 flex items-center justify-center bg-gray-100">
                                                                <Package className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        <div className="text-sm text-gray-500">{product.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {product.category.name}                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900"><ClientPrice amount={product.price} /></div>
                                                {product.compareAtPrice && (
                                                    <div className="text-xs text-gray-500 line-through">
                                                        <ClientPrice amount={product.compareAtPrice} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${product.inventory <= 5 ? 'text-red-600' :
                                                    product.inventory <= 10 ? 'text-yellow-600' : 'text-green-600'
                                                    }`}>
                                                    {product.inventory} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {product.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                    {product.isFeatured && (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-600 hover:text-gray-900"
                                                        asChild
                                                    >
                                                        <Link href={`/products/${product.slug}`} target="_blank">
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-900"
                                                        asChild
                                                    >
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-900"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Try adjusting your search or filter to find what you're looking for.
                        </p>
                        {(searchTerm || categoryFilter || statusFilter) && (
                            <div className="mt-6">
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setCategoryFilter("");
                                        setStatusFilter("");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}