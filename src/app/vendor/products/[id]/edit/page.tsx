"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Package,
    DollarSign,
    Tag,
    Image as ImageIcon,
    Save,
    Trash2
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
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().min(0.01, "Price must be greater than 0"),
    compareAtPrice: z.number().optional(),
    costPrice: z.number().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    inventory: z.number().min(0, "Inventory cannot be negative"),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    tags: z.string().optional(),
    brand: z.string().optional(),
    isPublished: z.boolean(),
    lowStockThreshold: z.number().min(0),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface ProductImage {
    id: string;
    url: string;
    alt?: string;
    position: number;
}

interface ProductData {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    sku?: string;
    barcode?: string;
    inventory: number;
    weight?: number;
    dimensions?: string;
    categoryId: string;
    tags?: string;
    brand?: string;
    isPublished: boolean;
    lowStockThreshold: number;
    images: ProductImage[];
    category: Category;
}

export default function EditProductPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [product, setProduct] = useState<ProductData | null>(null);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [tagsList, setTagsList] = useState<string[]>([]);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema), defaultValues: {
            name: "",
            description: "",
            price: 0,
            compareAtPrice: 0,
            costPrice: 0,
            sku: "",
            barcode: "",
            inventory: 0,
            weight: 0,
            dimensions: "",
            categoryId: "",
            tags: "",
            brand: "",
            isPublished: false,
            lowStockThreshold: 10,
        },
    });

    // Load product data and categories
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch categories
                const categoriesResponse = await fetch("/api/categories");
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(categoriesData.categories || []);
                }

                // Fetch product
                const productResponse = await fetch(`/api/vendor/products/${productId}`);
                if (!productResponse.ok) {
                    throw new Error("Failed to fetch product");
                }

                const productData = await productResponse.json();
                setProduct(productData.product);
                setExistingImages(productData.product.images || []);

                // Set form values
                const tags = productData.product.tags ? productData.product.tags.split(",") : [];
                setTagsList(tags);

                form.reset({
                    name: productData.product.name,
                    description: productData.product.description || "",
                    price: productData.product.price,
                    compareAtPrice: productData.product.compareAtPrice || 0,
                    costPrice: productData.product.costPrice || 0,
                    sku: productData.product.sku || "",
                    barcode: productData.product.barcode || "",
                    inventory: productData.product.inventory,
                    weight: productData.product.weight || 0,
                    dimensions: productData.product.dimensions || "",
                    categoryId: productData.product.categoryId,
                    tags: productData.product.tags || "",
                    brand: productData.product.brand || "",
                    isPublished: productData.product.isPublished,
                    lowStockThreshold: productData.product.lowStockThreshold,
                });

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load product data");
                router.push("/vendor/products");
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchData();
        }
    }, [productId, form, router]);

    // Handle new image upload
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const totalImages = existingImages.length + newImages.length + files.length;

        if (totalImages > 10) {
            toast.error("Maximum 10 images allowed");
            return;
        }

        const updatedNewImages = [...newImages, ...files];
        setNewImages(updatedNewImages);

        // Create previews
        const newPreviews = updatedNewImages.map(file => URL.createObjectURL(file));
        setNewImagePreviews(newPreviews);
    };

    // Remove existing image
    const removeExistingImage = (imageId: string) => {
        setExistingImages(existingImages.filter(img => img.id !== imageId));
    };

    // Remove new image
    const removeNewImage = (index: number) => {
        const updatedNewImages = newImages.filter((_, i) => i !== index);
        const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
        setNewImages(updatedNewImages);
        setNewImagePreviews(updatedPreviews);
    };

    // Handle tags
    const addTag = () => {
        if (tagInput.trim() && !tagsList.includes(tagInput.trim())) {
            const newTags = [...tagsList, tagInput.trim()];
            setTagsList(newTags);
            form.setValue("tags", newTags.join(","));
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = tagsList.filter(tag => tag !== tagToRemove);
        setTagsList(newTags);
        form.setValue("tags", newTags.join(","));
    };

    const onSubmit = async (data: ProductFormData) => {
        if (!session?.user || session.user.role !== "VENDOR") {
            toast.error("Unauthorized");
            return;
        }

        setIsSaving(true);
        try {
            // Upload new images first
            const uploadedImages: string[] = [];
            for (const image of newImages) {
                const formData = new FormData();
                formData.append("file", image);
                formData.append("folder", "products");

                const uploadResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    uploadedImages.push(uploadData.url);
                } else {
                    throw new Error("Failed to upload image");
                }
            }

            // Update product
            const updateData = {
                ...data,
                existingImages: existingImages.map(img => img.id),
                newImages: uploadedImages,
            };

            const response = await fetch(`/api/vendor/products/${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error("Failed to update product");
            }

            toast.success("Product updated successfully");
            router.push("/vendor/products");
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!session?.user || session.user.role !== "VENDOR") {
            toast.error("Unauthorized");
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/vendor/products/${productId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete product");
            }

            toast.success("Product deleted successfully");
            router.push("/vendor/products");
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading || !product) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/vendor/products">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Product</h1>
                        <p className="text-gray-600">Update your product information</p>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product
                                and remove it from your catalog.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Same form structure as create product page but with existing data */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Product Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Package className="h-5 w-5 mr-2" />
                                        Product Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter product name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter product description"
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Brand</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Brand name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <DollarSign className="h-5 w-5 mr-2" />
                                        Pricing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="compareAtPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Compare At Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="costPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cost Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Inventory */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Inventory & Shipping</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="sku"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>SKU</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="SKU-001" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="barcode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Barcode</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123456789" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="inventory"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Inventory *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Weight (kg)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.0"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dimensions"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dimensions</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="L x W x H" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="lowStockThreshold"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Low Stock Alert</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="10"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Publishing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Publishing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="isPublished"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Published</FormLabel>
                                                    <FormDescription>
                                                        Make this product visible to customers
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Product Images */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <ImageIcon className="h-5 w-5 mr-2" />
                                        Product Images
                                    </CardTitle>
                                    <CardDescription>
                                        Upload up to 10 images for your product
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Existing Images */}
                                    {existingImages.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Current Images</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {existingImages.map((image) => (
                                                    <div key={image.id} className="relative">
                                                        <img
                                                            src={image.url}
                                                            alt={image.alt || product.name}
                                                            className="w-full h-24 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingImage(image.id)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Images Preview */}
                                    {newImagePreviews.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">New Images</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {newImagePreviews.map((preview, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={preview}
                                                            alt={`New preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload New Images */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-sm text-gray-600">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG, GIF up to 10MB
                                            </p>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tags */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Tag className="h-5 w-5 mr-2" />
                                        Product Tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add tag"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                        />
                                        <Button type="button" onClick={addTag} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {tagsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {tagsList.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="ml-1 hover:text-red-500"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <Link href="/vendor/products">
                            <Button variant="outline" disabled={isSaving}>
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
