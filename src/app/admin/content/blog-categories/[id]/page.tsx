"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const blogCategorySchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    slug: z.string().min(2, { message: "Slug must be at least 2 characters" }).regex(/^[a-z0-9-]+$/, {
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
    description: z.string().optional(),
});

type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;

export default function EditBlogCategoryPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const form = useForm<BlogCategoryFormValues>({
        resolver: zodResolver(blogCategorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
        },
    });

    // Fetch category data
    useEffect(() => {
        const fetchCategory = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/admin/blog-categories/${params.id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch category");
                }

                const category = await response.json();

                form.reset({
                    name: category.name,
                    slug: category.slug,
                    description: category.description || "",
                });
            } catch (err) {
                console.error("Error fetching category:", err);
                setError("Failed to load category. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [params.id, form]);

    const onSubmit = async (values: BlogCategoryFormValues) => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/admin/blog-categories/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update blog category");
            }

            toast.success("Blog category updated successfully");
            router.push("/admin/content/blog-categories");
        } catch (error) {
            console.error("Error updating blog category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update blog category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCategory = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/admin/blog-categories/${params.id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.postsCount) {
                    throw new Error(`Cannot delete category that is used by ${data.postsCount} blog posts. Remove the category from these posts first.`);
                } else {
                    throw new Error(data.error || "Failed to delete category");
                }
            }

            toast.success("Blog category deleted successfully");
            router.push("/admin/content/blog-categories");
        } catch (error) {
            console.error("Error deleting blog category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete category");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading category...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-semibold text-xl mb-2">Error</p>
                <p className="mb-4">{error}</p>
                <Button asChild>
                    <Link href="/admin/content/blog-categories">Back to Categories</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/content/blog-categories">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Blog Category</h1>
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
                </div>
            </div>

            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Category Details</CardTitle>
                            <CardDescription>
                                Update this blog category.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Category name" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The display name of the category.
                                        </FormDescription>
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
                                            <Input placeholder="category-slug" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The URL-friendly version of the name.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Brief description of this category"
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Explain what types of posts belong in this category.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push("/admin/content/blog-categories")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this category?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={deleteCategory}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
