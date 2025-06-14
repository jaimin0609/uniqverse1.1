"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { ClientDate } from "@/components/ui/client-date";

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string;
    productCount?: number;
    createdAt: string;
    updatedAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/categories');

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete category');
            }

            // Remove the deleted category from the state
            setCategories(categories.filter(category => category.id !== id));
        } catch (err) {
            console.error('Error deleting category:', err);
            alert('Failed to delete category. Please try again.');
        }
    };

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Product Categories</h1>
                <Button asChild>
                    <Link href="/admin/categories/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Link>
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                    <Button variant="ghost" size="sm" onClick={fetchCategories} className="ml-2">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                </div>
            )}

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading categories...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No categories found. Create your first category to get started.</p>
                        <Button asChild>
                            <Link href="/admin/categories/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Products
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                        {category.parentId && <div className="text-xs text-gray-500 mt-1">Sub-category</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{category.slug}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{category.productCount || 0}</div>
                                    </td>                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ClientDate
                                            date={category.createdAt}
                                            className="text-sm text-gray-500"
                                            format="short"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm" asChild className="mr-2">
                                            <Link href={`/admin/categories/${category.id}`}>
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}