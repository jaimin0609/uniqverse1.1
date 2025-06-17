"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    displayName?: string;
    level?: number;
}

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parentId: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({}); useEffect(() => {
        const initializeParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        initializeParams();
    }, [params]);

    useEffect(() => {
        if (!resolvedParams) return;

        const fetchData = async () => {
            try {
                // Fetch the current category
                const categoryResponse = await fetch(`/api/admin/categories/${resolvedParams.id}`);
                if (!categoryResponse.ok) {
                    throw new Error('Failed to fetch category');
                }

                const categoryData = await categoryResponse.json();
                setFormData({
                    name: categoryData.name || "",
                    slug: categoryData.slug || "",
                    description: categoryData.description || "",
                    parentId: categoryData.parentId || "",
                });

                // Fetch all categories for parent dropdown
                const categoriesResponse = await fetch('/api/admin/categories');
                if (!categoriesResponse.ok) {
                    throw new Error('Failed to fetch categories');
                } const categoriesData = await categoriesResponse.json();
                // Filter out the current category and its children from potential parents
                const allCategories = categoriesData.hierarchicalCategories || categoriesData.categories;
                const filteredCategories = allCategories.filter(
                    (category: Category) => category.id !== resolvedParams.id
                );
                setParentCategories(filteredCategories || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('Failed to load category data. Please try again.');
                router.push('/admin/categories');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [resolvedParams, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Clear error when field is edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // Auto-generate slug from name if the user hasn't manually edited slug
        if (name === "name" && formData.slug === "") {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setFormData((prev) => ({ ...prev, slug }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Category name is required";
        }

        if (!formData.slug.trim()) {
            newErrors.slug = "Slug is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resolvedParams) return;

        if (!validateForm()) {
            return;
        }

        setIsSaving(true); try {
            const response = await fetch(`/api/admin/categories/${resolvedParams.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update category');
            }

            // Navigate back to categories list
            router.push('/admin/categories');
            router.refresh();
        } catch (error) {
            console.error('Error updating category:', error);
            alert(error instanceof Error ? error.message : 'Failed to update category. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }; const handleDelete = async () => {
        if (!resolvedParams) return;

        if (!confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
            return;
        }

        setIsSaving(true); try {
            const response = await fetch(`/api/admin/categories/${resolvedParams.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete category');
            }

            router.push('/admin/categories');
            router.refresh();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete category. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }; if (isLoading || !resolvedParams) {
        return (
            <div className="container py-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading category...</p>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            asChild
                        >
                            <Link href="/admin/categories">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        disabled={isSaving}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Category
                    </Button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                                Slug
                            </label>
                            <input
                                type="text"
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                className={`w-full p-2 border rounded-md ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                This will be used for category URLs.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                                Parent Category (Optional)
                            </label>
                            <select
                                id="parentId"
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">None (Top Level Category)</option>                                {parentCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.displayName || category.name}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Select a parent category if this is a sub-category.
                            </p>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/admin/categories')}
                                className="mr-2"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}