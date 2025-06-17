"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Save, X, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { productFormSchema } from "@/lib/validations/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { extractVariantStructure, parseVariantOptions } from "@/lib/variant-utils";
import DescriptionDisplay from "@/components/admin/DescriptionDisplay";
import VariantDebugger from "@/components/admin/VariantDebugger";
import { useCurrency } from "@/contexts/currency-provider";
import { FormattedPrice } from "@/components/ui/formatted-price";

// Define ProductFormValues type based on the schema
type ProductFormValues = z.infer<typeof productFormSchema>;
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    slug: string;
    displayName?: string;
    level?: number;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.id as string;

    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [variantTypes, setVariantTypes] = useState<string[]>([]);
    const [newVariantType, setNewVariantType] = useState("");
    const [variantOptions, setVariantOptions] = useState<Record<string, string[]>>({});
    const [newVariantOption, setNewVariantOption] = useState("");
    const [selectedVariantType, setSelectedVariantType] = useState<string | null>(null);
    const [productData, setProductData] = useState<any>(null);

    // Get currency context for price display
    const { currency, formatPrice } = useCurrency();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            price: 0,
            compareAtPrice: undefined,
            inventory: 0,
            images: [],
            categoryId: "",
            isPublished: true,
            isFeatured: false,
            variants: {}
        }
    }); const watchImages = watch("images");

    // Fetch product data and categories
    useEffect(() => {
        async function fetchProductAndCategories() {
            if (!productId) return;

            try {
                // Fetch product data
                const productResponse = await fetch(`/api/admin/products/${productId}`);

                if (!productResponse.ok) {
                    throw new Error(`Failed to fetch product: ${productResponse.statusText}`);
                } const productData = await productResponse.json();
                console.log("Product data:", productData);

                // Store full product data in state for use in components
                setProductData(productData);// Extract the variant types and options from the product data
                if (productData.variants && productData.variants.length > 0) {
                    console.log('Processing product variants:', productData.variants.length);

                    // Enhanced debug logging
                    console.log('Product has variantTypes field:', Boolean(productData.variantTypes));
                    if (productData.variantTypes) {
                        console.log('Raw variantTypes:', productData.variantTypes.substring(0, 100) + '...');
                    }

                    // First check if we have structured variant types in the product data
                    if (productData.variantTypes) {
                        try {
                            const parsedVariantTypes = JSON.parse(productData.variantTypes);
                            console.log('Parsed variantTypes:', parsedVariantTypes);

                            if (parsedVariantTypes && typeof parsedVariantTypes === 'object') {
                                setVariantTypes(Object.keys(parsedVariantTypes));
                                setVariantOptions(parsedVariantTypes);
                                setValue("variants", parsedVariantTypes);
                            }
                        } catch (e) {
                            console.error("Error parsing variant types:", e);
                            toast.error("There was an error parsing variant data. Using fallback method.");

                            // Use our utility function to extract variant structure as fallback
                            const { variantTypes: types, variantOptions: options } =
                                extractVariantStructure(productData.variants);

                            setVariantTypes(types);
                            setVariantOptions(options);
                            setValue("variants", options);
                        }
                    } else {
                        console.log('No variantTypes field, extracting from variants');

                        // Use our utility function to extract variant structure
                        const { variantTypes: types, variantOptions: options } =
                            extractVariantStructure(productData.variants);

                        console.log('Extracted variant types:', types);
                        console.log('Extracted variant options:', options);

                        setVariantTypes(types);
                        setVariantOptions(options);
                        setValue("variants", options);
                    }
                }// Debug the description data
                console.log('Product description in edit page:', productData.description ? productData.description.substring(0, 50) + '...' : 'No description');
                console.log('Description type:', typeof productData.description);
                console.log('Description length:', productData.description?.length || 0);                // Pre-populate form with product data
                reset({
                    name: productData.name,
                    slug: productData.slug,
                    description: productData.description || "", // Ensure description is never undefined
                    price: productData.price,
                    compareAtPrice: productData.compareAtPrice,
                    inventory: productData.inventory,
                    images: productData.images, categoryId: productData.categoryId,
                    isPublished: productData.isPublished,
                    isFeatured: productData.isFeatured,
                    variants: variantOptions // Add variants to form data
                });

                // Fetch categories
                const categoriesResponse = await fetch('/api/admin/categories');

                if (!categoriesResponse.ok) {
                    throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
                } const categoriesData = await categoriesResponse.json();
                setCategories(categoriesData.hierarchicalCategories || categoriesData.categories);

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load product data");
            }
        }

        if (productId) {
            fetchProductAndCategories();
        }
    }, [productId, reset, setValue]);

    // Early return if no productId is available (after hooks)
    if (!productId) {
        return (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Invalid Product</h3>
                <p className="text-yellow-600 mb-4">No product ID was provided.</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/products">Back to Products</Link>
                </Button>
            </div>
        );
    }

    const onSubmit = async (data: ProductFormValues) => {
        if (!productId) return;

        try {
            setIsSaving(true);

            // If there are variant options, add them to the form data
            if (Object.keys(variantOptions).length > 0) {
                data.variants = variantOptions;
            }

            // Convert numeric strings to numbers
            const formattedData = {
                ...data,
                price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
                compareAtPrice: data.compareAtPrice
                    ? (typeof data.compareAtPrice === 'string'
                        ? parseFloat(data.compareAtPrice)
                        : data.compareAtPrice)
                    : null,
                inventory: typeof data.inventory === 'string' ? parseInt(data.inventory) : data.inventory,
            };

            console.log("Submitting data:", formattedData);

            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update product');
            }

            toast.success("Product updated successfully");
            router.push('/admin/products');

        } catch (error: any) {
            console.error("Error updating product:", error);
            toast.error(error.message || "Failed to update product");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        try {
            setIsUploading(true);

            const files = Array.from(e.target.files);

            // Here you would normally upload to your storage service
            // For this implementation, we'll use a placeholder URL
            const uploadedUrls = files.map((file) => URL.createObjectURL(file));

            // Add uploaded images to the current images array
            setValue("images", [...watchImages, ...uploadedUrls]);

            toast.success(`${files.length} images uploaded successfully`);
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Failed to upload images");
        } finally {
            setIsUploading(false);
            // Reset the input field
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = [...watchImages];
        updatedImages.splice(index, 1);
        setValue("images", updatedImages);
    };

    const addVariantType = () => {
        if (!newVariantType || newVariantType.trim() === '') return;
        if (variantTypes.includes(newVariantType.trim())) {
            toast.error("Variant type already exists");
            return;
        }

        setVariantTypes([...variantTypes, newVariantType.trim()]);
        setVariantOptions({
            ...variantOptions,
            [newVariantType.trim()]: []
        });
        setSelectedVariantType(newVariantType.trim());
        setNewVariantType('');
    };

    const removeVariantType = (type: string) => {
        const { [type]: _, ...rest } = variantOptions;
        setVariantOptions(rest);

        if (selectedVariantType === type) {
            setSelectedVariantType(null);
        }
    };

    const addVariantOption = () => {
        if (!selectedVariantType) return;
        if (!newVariantOption || newVariantOption.trim() === '') return;
        if (variantOptions[selectedVariantType].includes(newVariantOption.trim())) {
            toast.error("Option already exists for this variant type");
            return;
        }

        const updatedOptions = {
            ...variantOptions,
            [selectedVariantType]: [...variantOptions[selectedVariantType], newVariantOption.trim()]
        };

        setVariantOptions(updatedOptions);
        setNewVariantOption('');
    };

    const removeVariantOption = (type: string, option: string) => {
        setVariantOptions({
            ...variantOptions,
            [type]: variantOptions[type].filter(item => item !== option)
        });
    };

    return (
        <div>
            <div className="bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <Button variant="outline" asChild className="w-fit">
                            <Link href="/admin/products">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
                <form onSubmit={handleSubmit(onSubmit)}>
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
                                    {...register("name")}
                                    className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug (URL)
                                </label>
                                <input
                                    type="text"
                                    id="slug"
                                    {...register("slug")}
                                    className={`w-full p-2 border rounded-md ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="product-url-slug (leave blank to auto-generate)"
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
                            </div>                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        id="description"
                                        rows={5}
                                        {...register("description")}
                                        className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                    ></textarea>

                                    {/* Use our new description display component */}
                                    <DescriptionDisplay
                                        description={watch("description") || ""}
                                        showHtmlPreview={true}
                                    />

                                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Images
                                </label>
                                <div className="border border-dashed border-gray-300 rounded-md p-4">
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        {watchImages && watchImages.map((image, index) => (
                                            <div key={index} className="relative w-24 h-24">
                                                <img
                                                    src={image}
                                                    alt={`Product image ${index + 1}`}
                                                    className="w-24 h-24 object-cover rounded-md"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">SVG, PNG, JPG or WEBP (MAX. 2MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                multiple
                                                accept="image/*"
                                                disabled={isUploading}
                                            />
                                        </label>
                                    </div>
                                    {errors.images && <p className="mt-1 text-sm text-red-500">{errors.images.message}</p>}
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Product Variants</h3>

                                <div className="mb-4">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Variant type (e.g. Color)"
                                            value={newVariantType}
                                            onChange={(e) => setNewVariantType(e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-md"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addVariantType}
                                        >
                                            Add Type
                                        </Button>
                                    </div>
                                </div>

                                {Object.keys(variantOptions).length > 0 && (
                                    <div>
                                        <div className="flex gap-2 mb-4">
                                            {Object.keys(variantOptions).map((type) => (<Button
                                                key={type}
                                                type="button"
                                                variant={selectedVariantType === type ? "default" : "outline"}
                                                onClick={() => setSelectedVariantType(type)}
                                                className="flex items-center"
                                            >
                                                {type}
                                                <span
                                                    className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeVariantType(type);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </span>
                                            </Button>
                                            ))}
                                        </div>

                                        {selectedVariantType && (
                                            <div>
                                                <p className="mb-2 text-sm font-medium">
                                                    Options for {selectedVariantType}:
                                                </p>

                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder={`Add ${selectedVariantType} option`}
                                                        value={newVariantOption}
                                                        onChange={(e) => setNewVariantOption(e.target.value)}
                                                        className="flex-1 p-2 border border-gray-300 rounded-md"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={addVariantOption}
                                                    >
                                                        Add Option
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {variantOptions[selectedVariantType].map((option) => (
                                                        <div key={option} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                                                            <span className="text-sm">{option}</span>
                                                            <button
                                                                type="button"
                                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                                                onClick={() => removeVariantOption(selectedVariantType, option)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>)}
                            </div>                            {/* Add Variant Debugger */}
                            {watch("variants") && typeof watch("variants") === 'object' && Object.keys(watch("variants") || {}).length > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                        <h4 className="text-sm font-medium text-gray-700">Variant Structure Information</h4>
                                    </div>
                                    <VariantDebugger
                                        variants={productData?.variants || []}
                                        variantTypes={productData?.variantTypes || null}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Column - Pricing, Inventory, Status */}
                        <div className="space-y-6">
                            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Product Status</h3>

                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        {...register("isPublished")}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                                        Published
                                    </label>
                                </div>                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isFeatured"
                                        {...register("isFeatured")}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                                        Featured
                                    </label>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>                                <div className="mb-4">
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        Price ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="price"
                                        {...register("price")}
                                        className={`w-full p-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
                                    {watch("price") && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Display price: <FormattedPrice amount={Number(watch("price")) || 0} />
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                        Compare at Price ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="compareAtPrice"
                                        {...register("compareAtPrice")}
                                        className={`w-full p-2 border rounded-md ${errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.compareAtPrice && <p className="mt-1 text-sm text-red-500">{errors.compareAtPrice.message}</p>}
                                    {watch("compareAtPrice") && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Display price: <FormattedPrice amount={Number(watch("compareAtPrice")) || 0} />
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Original price for showing a discount. Leave empty for no compare price.
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-md p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Inventory</h3>

                                <div>
                                    <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        id="inventory"
                                        {...register("inventory")}
                                        className={`w-full p-2 border rounded-md ${errors.inventory ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.inventory && <p className="mt-1 text-sm text-red-500">{errors.inventory.message}</p>}
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
                                        {...register("categoryId")}
                                        className={`w-full p-2 border rounded-md ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select a category</option>                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.displayName || category.name}
                                            </option>
                                        ))}
                                    </select>                                    {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>}
                                </div>                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/products")}
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
                </form>
            </div>
        </div>
    );
}