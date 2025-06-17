"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Plus, X, Image, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Form validation schema
const blogPostSchema = z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    slug: z.string().min(2, { message: "Slug must be at least 2 characters" }).regex(/^[a-z0-9-]+$/, {
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
    excerpt: z.string().optional(),
    content: z.string().min(10, { message: "Content must be at least 10 characters" }),
    coverImage: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    isPublished: z.boolean().default(false),
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    tags: z.string().optional(),
    isAdEnabled: z.boolean().default(false),
});

interface Category {
    id: string;
    name: string;
    slug: string;
}

type BlogPostFormValues = {
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    isAdEnabled: boolean;
    excerpt?: string;
    coverImage?: string;
    metaTitle?: string;
    metaDesc?: string;
    tags?: string;
    categories?: string[];
    externalLinks?: Array<{ title: string; url: string }>;
};

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [externalLinks, setExternalLinks] = useState<Array<{ title: string; url: string }>>([]);
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

    // Initialize params
    useEffect(() => {
        const initializeParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        initializeParams();
    }, [params]);
    const form = useForm<BlogPostFormValues>({
        resolver: zodResolver(blogPostSchema) as any,
        defaultValues: {
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            coverImage: "",
            isPublished: false,
            metaTitle: "",
            metaDesc: "",
            tags: "",
            isAdEnabled: false,
            categories: [],
            externalLinks: [],
        },
    });    // Fetch blog post data and categories
    useEffect(() => {
        if (!resolvedParams) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch blog post data
                const response = await fetch(`/api/admin/blog-posts/${resolvedParams.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch blog post");
                }

                const blogPost = await response.json();

                // Fetch categories
                const categoriesResponse = await fetch("/api/admin/blog-categories");
                if (!categoriesResponse.ok) {
                    throw new Error("Failed to fetch categories");
                }

                const categoriesData = await categoriesResponse.json();
                setCategories(categoriesData);

                // Set form values
                form.reset({
                    title: blogPost.title,
                    slug: blogPost.slug,
                    excerpt: blogPost.excerpt || "",
                    content: blogPost.content,
                    coverImage: blogPost.coverImage || "",
                    isPublished: blogPost.isPublished,
                    metaTitle: blogPost.metaTitle || "",
                    metaDesc: blogPost.metaDesc || "",
                    tags: blogPost.tags || "",
                    isAdEnabled: blogPost.isAdEnabled || false,
                });

                // Set external links
                if (blogPost.externalLinks) {
                    setExternalLinks(blogPost.externalLinks);
                }

                // Set selected categories
                if (blogPost.BlogCategory && blogPost.BlogCategory.length > 0) {
                    const categoryIds = blogPost.BlogCategory.map((cat: any) => cat.id);
                    setSelectedCategories(categoryIds);
                    form.setValue("categories", categoryIds);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [resolvedParams, form]);

    // Add external link
    const addExternalLink = () => {
        if (newLinkTitle && newLinkUrl) {
            if (!newLinkUrl.startsWith("http")) {
                setNewLinkUrl(`https://${newLinkUrl}`);
            }

            try {
                // Validate URL
                new URL(newLinkUrl);

                setExternalLinks([...externalLinks, { title: newLinkTitle, url: newLinkUrl }]);
                setNewLinkTitle("");
                setNewLinkUrl("");
            } catch (e) {
                toast.error("Please enter a valid URL");
            }
        } else {
            toast.error("Both title and URL are required for external links");
        }
    };

    // Remove external link
    const removeExternalLink = (index: number) => {
        setExternalLinks(externalLinks.filter((_, i) => i !== index));
    };    // Form submission handler
    const onSubmit = async (values: BlogPostFormValues) => {
        if (!resolvedParams) return;

        setIsSubmitting(true);

        try {
            // Add external links to values
            values.externalLinks = externalLinks;
            values.categories = selectedCategories;

            const response = await fetch(`/api/admin/blog-posts/${resolvedParams.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update blog post");
            }

            toast.success("Blog post updated successfully");
            router.push("/admin/content/blog");
        } catch (error) {
            console.error("Error updating blog post:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update blog post");
        } finally {
            setIsSubmitting(false);
        }
    };    // Delete blog post
    const deleteBlogPost = async () => {
        if (!resolvedParams) return;

        try {
            const response = await fetch(`/api/admin/blog-posts/${resolvedParams.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete blog post");
            }

            toast.success("Blog post deleted successfully");
            router.push("/admin/content/blog");
        } catch (error) {
            console.error("Error deleting blog post:", error);
            toast.error("Failed to delete blog post");
        } finally {
            setShowDeleteDialog(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading blog post...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-semibold text-xl mb-2">Error</p>
                <p className="mb-4">{error}</p>
                <Button asChild>
                    <Link href="/admin/content/blog">Back to Blog Posts</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/content/blog">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Blog Posts
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button type="submit" form="blog-post-form" disabled={isSubmitting}>
                        {isSubmitting ? (
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

            <Form {...form}>
                <form id="blog-post-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Post Content</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter blog post title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Slug</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="url-friendly-slug" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    This will be used for the blog post URL.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="excerpt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Excerpt</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Brief summary of the post (optional)"
                                                        className="resize-none h-20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    A short preview text shown in listings and search results.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Write your blog post content here..."
                                                        className="min-h-[300px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* SEO Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="metaTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="SEO title (optional, defaults to post title)"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="metaDesc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="SEO description (optional, defaults to excerpt)"
                                                        className="resize-none h-20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* External Links */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>External Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-4">
                                        {externalLinks.length > 0 && (
                                            <div className="space-y-2">
                                                {externalLinks.map((link, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <LinkIcon className="h-4 w-4 text-gray-500" />
                                                            <div>
                                                                <p className="font-medium">{link.title}</p>
                                                                <p className="text-sm text-blue-500">{link.url}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeExternalLink(index)}
                                                        >
                                                            <X className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <FormLabel htmlFor="linkTitle">Link Title</FormLabel>
                                                <Input
                                                    id="linkTitle"
                                                    value={newLinkTitle}
                                                    onChange={(e) => setNewLinkTitle(e.target.value)}
                                                    placeholder="e.g. GitHub Repository"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormLabel htmlFor="linkUrl">URL</FormLabel>
                                                <Input
                                                    id="linkUrl"
                                                    value={newLinkUrl}
                                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addExternalLink}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Publishing</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="isPublished"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Published
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Make this post visible to visitors
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

                                    <FormField
                                        control={form.control}
                                        name="isAdEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        AdSense Integration
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Enable Google AdSense on this post
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

                            <Card>
                                <CardHeader>
                                    <CardTitle>Featured Image</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="coverImage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="space-y-4">
                                                        {field.value && (
                                                            <div className="relative w-full h-40 rounded-md overflow-hidden">
                                                                <img
                                                                    src={field.value}
                                                                    alt="Cover"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="absolute top-2 right-2"
                                                                    onClick={() => form.setValue("coverImage", "")}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <Input
                                                            placeholder="Image URL"
                                                            {...field}
                                                            className={field.value ? "hidden" : ""}
                                                        />
                                                        {!field.value && (
                                                            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                                                                <Image className="h-8 w-8 mx-auto text-gray-400" />
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    Enter an image URL above
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {categories.length > 0 ? (
                                            categories.map((category) => (
                                                <div key={category.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`category-${category.id}`}
                                                        value={category.id}
                                                        checked={selectedCategories.includes(category.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedCategories([...selectedCategories, category.id]);
                                                            } else {
                                                                setSelectedCategories(
                                                                    selectedCategories.filter((id) => id !== category.id)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`category-${category.id}`}>
                                                        {category.name}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">No categories found</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="tag1, tag2, tag3"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Separate tags with commas
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this blog post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteBlogPost}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
