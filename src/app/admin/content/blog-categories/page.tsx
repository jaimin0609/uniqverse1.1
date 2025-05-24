"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        blogPosts: number;
    };
    blogPostCount?: number;
}

export default function BlogCategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/blog-categories");
            if (!response.ok) {
                throw new Error("Failed to fetch blog categories");
            }

            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error("Error fetching blog categories:", err);
            setError("Failed to load blog categories. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = (category: BlogCategory) => {
        setCategoryToDelete(category);
        setShowDeleteDialog(true);
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/admin/blog-categories/${categoryToDelete.id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.postsCount) {
                    toast.error(
                        `Cannot delete category that is used by ${data.postsCount} blog posts. Remove the category from these posts first.`
                    );
                } else {
                    toast.error(data.error || "Failed to delete category");
                }
                return;
            }

            setCategories(categories.filter((c) => c.id !== categoryToDelete.id));
            toast.success(`Category "${categoryToDelete.name}" deleted successfully`);
        } catch (err) {
            console.error("Error deleting blog category:", err);
            toast.error("Failed to delete category. Please try again.");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Blog Categories</h1>
                    <p className="text-gray-500">Manage categories for your blog posts</p>
                </div>
                <Button asChild>
                    <Link href="/admin/content/blog-categories/create">
                        <Plus className="h-4 w-4 mr-2" />
                        New Category
                    </Link>
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div className="flex-1">{error}</div>
                    <Button variant="ghost" size="sm" onClick={fetchCategories}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="bg-white rounded-md shadow p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-gray-500">Loading blog categories...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-md shadow p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium mb-2">No categories found</h3>
                        <p className="text-gray-500 mb-4">
                            Create your first blog category to help organize your content.
                        </p>
                        <Button asChild>
                            <Link href="/admin/content/blog-categories/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Category
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-md shadow overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[200px]">Slug</TableHead>
                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                <TableHead className="w-[100px]">Posts</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="max-w-xs truncate">
                                            {category.description || <span className="text-gray-400">No description</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {category.blogPostCount || category._count?.blogPosts || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/content/blog-categories/${category.id}`}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the category "{categoryToDelete?.name}"?
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
                            onClick={confirmDeleteCategory}
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
