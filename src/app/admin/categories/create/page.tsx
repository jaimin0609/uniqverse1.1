"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
    displayName?: string;
    level?: number;
}

export default function CreateCategoryPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parentId: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Fetch parent categories
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/admin/categories');
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                } const data = await response.json();
                setParentCategories(data.hierarchicalCategories || data.categories || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Clear error when field is edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // Auto-generate slug from name
        if (name === "name") {
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create category');
            }

            // Navigate back to categories list
            router.push('/admin/categories');
            router.refresh();
        } catch (error) {
            console.error('Error creating category:', error);
            alert(error instanceof Error ? error.message : 'Failed to create category. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
                    </div>
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
                                This will be used for category URLs. Auto-generated from name.
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
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Category
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