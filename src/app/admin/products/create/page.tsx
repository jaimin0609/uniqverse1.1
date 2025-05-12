"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
}

const MAX_IMAGES = 8; // Maximum number of images per product (standardized to 8)

export default function CreateProductPage() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [variants, setVariants] = useState<{ [key: string]: string[] }>({});
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        price: "",
        compareAtPrice: "",
        categoryId: "",
        inventory: "0",
        isPublished: true,
        isFeatured: false,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showVariantOptions, setShowVariantOptions] = useState(false);
    const [newVariantType, setNewVariantType] = useState("");
    const [newVariantOption, setNewVariantOption] = useState("");

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/admin/categories', {
                    credentials: 'include', // Include cookies and authentication headers
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }

                const data = await response.json();
                setCategories(data.categories || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
                // Fallback to empty categories array
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const newImages = Array.from(e.target.files);

        // Check if adding these images would exceed the maximum
        if (selectedImages.length + newImages.length > MAX_IMAGES) {
            alert(`You can upload a maximum of ${MAX_IMAGES} images per product. You have ${selectedImages.length} images already.`);
            return;
        }

        setSelectedImages((prev) => [...prev, ...newImages]);

        // Generate preview URLs
        const newImageUrls = newImages.map((file) => URL.createObjectURL(file));
        setImageUrls((prev) => [...prev, ...newImageUrls]);
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imageUrls[index]); // Clean up
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const addVariantType = () => {
        if (!newVariantType.trim()) return;

        setVariants((prev) => ({
            ...prev,
            [newVariantType]: [],
        }));

        setNewVariantType("");
    };

    const addVariantOption = (type: string) => {
        if (!newVariantOption.trim()) return;

        setVariants((prev) => ({
            ...prev,
            [type]: [...(prev[type] || []), newVariantOption],
        }));

        setNewVariantOption("");
    };

    const removeVariantType = (type: string) => {
        const { [type]: _, ...rest } = variants;
        setVariants(rest);
    };

    const removeVariantOption = (type: string, index: number) => {
        setVariants((prev) => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Product name is required";
        }

        if (!formData.slug.trim()) {
            newErrors.slug = "Slug is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.price.trim()) {
            newErrors.price = "Price is required";
        } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            newErrors.price = "Price must be a positive number";
        }

        if (formData.compareAtPrice.trim() && (isNaN(Number(formData.compareAtPrice)) || Number(formData.compareAtPrice) <= 0)) {
            newErrors.compareAtPrice = "Compare at price must be a positive number";
        }

        if (Number(formData.inventory) < 0 || !Number.isInteger(Number(formData.inventory))) {
            newErrors.inventory = "Inventory must be a non-negative integer";
        }

        if (!formData.categoryId) {
            newErrors.categoryId = "Please select a category";
        }

        if (selectedImages.length === 0) {
            newErrors.images = "At least one product image is required";
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
            // Upload images first
            const uploadedImageUrls = await uploadImages(selectedImages);

            if (!uploadedImageUrls.length && selectedImages.length > 0) {
                throw new Error("Failed to upload images");
            }

            // Format data for API submission with proper type conversion
            const productData = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
                inventory: parseInt(formData.inventory),
                categoryId: formData.categoryId,
                isPublished: formData.isPublished, // Already a boolean from the checkbox
                isFeatured: formData.isFeatured, // Already a boolean from the checkbox
                variants: Object.keys(variants).length > 0 ? variants : undefined,
                images: uploadedImageUrls,
            };

            console.log("Submitting product data:", productData);

            // Submit product data to API
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
                credentials: 'include', // Include cookies for authentication
            });

            // Check if response is not 2xx status code
            if (!response.ok) {
                let errorData;
                try {
                    // Try to parse the error response as JSON
                    errorData = await response.json();
                } catch (e) {
                    // If not JSON, get the text response
                    const errorText = await response.text();
                    console.error("Failed to parse error response:", errorText);
                    throw new Error(errorText || "Failed to create product");
                }

                console.error("API Error Response:", errorData);

                // Handle Zod validation errors
                if (errorData && errorData.details) {
                    const formattedErrors: string[] = [];

                    for (const [field, fieldErrors] of Object.entries(errorData.details)) {
                        if (field === '_errors' && Array.isArray(fieldErrors)) {
                            formattedErrors.push(...fieldErrors.map(String));
                        } else if (typeof fieldErrors === 'object' && fieldErrors !== null) {
                            // @ts-ignore - we know this structure from Zod errors
                            const messages = fieldErrors._errors;
                            if (Array.isArray(messages) && messages.length > 0) {
                                formattedErrors.push(`${field}: ${messages.join(', ')}`);
                            }
                        }
                    }

                    if (formattedErrors.length > 0) {
                        throw new Error(`Validation errors: ${formattedErrors.join('; ')}`);
                    }
                }

                throw new Error(errorData?.error || 'Failed to create product');
            }

            const createdProduct = await response.json();
            console.log("Product created successfully:", createdProduct);

            // Show success message and redirect
            alert("Product created successfully!");
            router.push("/admin/products");
        } catch (error) {
            console.error("Error creating product:", error);
            alert(error instanceof Error ? error.message : "Failed to create product. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to upload images
    const uploadImages = async (images: File[]): Promise<string[]> => {
        if (!images.length) return [];

        const uploadedUrls: string[] = [];

        try {
            // Upload each image to the server
            for (const image of images) {
                const formData = new FormData();
                formData.append('file', image);

                const response = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    console.error(`Failed to upload image ${image.name}`);
                    const errorData = await response.json();
                    console.error('Upload error:', errorData);
                    continue;
                }

                const data = await response.json();
                uploadedUrls.push(data.url);
            }
        } catch (error) {
            console.error("Error uploading images:", error);
        }

        return uploadedUrls;
    };

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            asChild
                        >
                            <Link href="/admin/products">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column - Basic Information */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name
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
                                    This will be used for the product URL. Auto-generated from name.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                ></textarea>
                                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                            </div>

                            {/* Product Images */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Product Images
                                    </label>
                                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm px-3 py-1.5 rounded-md flex items-center">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload Images
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>

                                {errors.images && <p className="mt-1 text-sm text-red-500 mb-2">{errors.images}</p>}

                                {imageUrls.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {imageUrls.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-square rounded-md overflow-hidden border border-gray-200">
                                                    <img
                                                        src={url}
                                                        alt={`Product image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4 text-gray-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center">
                                        <div className="bg-gray-100 p-3 rounded-full">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Drag and drop images or click to upload
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG, WEBP up to 5MB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Variants */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Product Variants
                                    </label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowVariantOptions(!showVariantOptions)}
                                    >
                                        {showVariantOptions ? "Hide Options" : "Add Variants"}
                                    </Button>
                                </div>

                                {showVariantOptions && (
                                    <div className="border border-gray-200 rounded-md p-4 mt-2 bg-gray-50">
                                        <div className="flex items-center mb-4">
                                            <input
                                                type="text"
                                                placeholder="Variant type (e.g., Color, Size)"
                                                value={newVariantType}
                                                onChange={(e) => setNewVariantType(e.target.value)}
                                                className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={addVariantType}
                                            >
                                                Add
                                            </Button>
                                        </div>

                                        {Object.keys(variants).length > 0 ? (
                                            <div className="space-y-4">
                                                {Object.entries(variants).map(([type, options]) => (
                                                    <div key={type} className="border border-gray-200 rounded-md p-3 bg-white">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-sm font-medium">{type}</h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariantType(type)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center mb-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Add option"
                                                                value={newVariantOption}
                                                                onChange={(e) => setNewVariantOption(e.target.value)}
                                                                className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md mr-2"
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => addVariantOption(type)}
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {options.map((option, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center"
                                                                >
                                                                    {option}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeVariantOption(type, index)}
                                                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                Add variant types like Color, Size, Material, etc.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Pricing, Inventory, Status */}
                        <div className="space-y-6">
                            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Product Status</h3>

                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        name="isPublished"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                                        Published
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isFeatured"
                                        name="isFeatured"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                                        Featured Product
                                    </label>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>

                                <div className="mb-3">
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        Price ($)
                                    </label>
                                    <input
                                        type="text"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                                </div>

                                <div>
                                    <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                        Compare at Price ($)
                                    </label>
                                    <input
                                        type="text"
                                        id="compareAtPrice"
                                        name="compareAtPrice"
                                        value={formData.compareAtPrice}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md ${errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.compareAtPrice && (
                                        <p className="mt-1 text-sm text-red-500">{errors.compareAtPrice}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Original price for showing discounts
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Inventory</h3>

                                <div className="mb-3">
                                    <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        id="inventory"
                                        name="inventory"
                                        value={formData.inventory}
                                        onChange={handleInputChange}
                                        min="0"
                                        className={`w-full p-2 border rounded-md ${errors.inventory ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.inventory && <p className="mt-1 text-sm text-red-500">{errors.inventory}</p>}
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Organization</h3>

                                <div>
                                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/products")}
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
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Product
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}