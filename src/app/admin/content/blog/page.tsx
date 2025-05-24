"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BookOpen, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Calendar,
    User, ArrowUpDown, Tag, MessageSquare, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BlogPostData {
    id: string;
    title: string;
    slug: string;
    status: "published" | "draft";
    createdAt: string;
    updatedAt: string;
    author: string;
    excerpt: string;
    tags: string[];
    commentCount: number;
    isAdEnabled?: boolean;
    externalLinks?: any;
}

interface ApiResponse {
    blogPosts: {
        id: string;
        title: string;
        slug: string;
        isPublished: boolean;
        createdAt: string;
        updatedAt: string;
        excerpt: string;
        tags: string | null;
        isAdEnabled: boolean;
        externalLinks: any;
        User: {
            name: string;
            image: string | null;
        };
    }[];
    total: number;
    pagination: {
        take: number;
        skip: number;
        hasMore: boolean;
    };
}

export default function BlogPostsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState<BlogPostData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPostData | null>(null);
    const [sortField, setSortField] = useState<keyof BlogPostData>("updatedAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        const fetchBlogPosts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/admin/blog-posts?search=${searchQuery}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch blog posts');
                }

                const data: ApiResponse = await response.json();

                // Transform API response to match BlogPostData interface
                const transformedPosts: BlogPostData[] = data.blogPosts.map(post => ({
                    id: post.id,
                    title: post.title,
                    slug: post.slug,
                    status: post.isPublished ? "published" : "draft",
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                    author: post.User?.name || "Unknown Author",
                    excerpt: post.excerpt || "",
                    tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
                    commentCount: 0, // We can add actual comment count later
                    isAdEnabled: post.isAdEnabled,
                    externalLinks: post.externalLinks
                }));

                setPosts(transformedPosts);
            } catch (err) {
                console.error('Error fetching blog posts:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogPosts();
    }, [searchQuery]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (field: keyof BlogPostData) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    }; const handleDeletePost = (post: BlogPostData) => {
        setPostToDelete(post);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (postToDelete) {
            try {
                const response = await fetch(`/api/admin/blog-posts/${postToDelete.id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete blog post');
                }

                setPosts(posts.filter(post => post.id !== postToDelete.id));
                toast.success(`Blog post "${postToDelete.title}" deleted successfully`);
                setDeleteDialogOpen(false);
                setPostToDelete(null);
            } catch (err) {
                console.error('Error deleting blog post:', err);
                toast.error('Failed to delete blog post. Please try again.');
            }
        }
    };

    // Filter posts based on search query
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort posts
    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (sortField === "title" || sortField === "slug" || sortField === "author" || sortField === "excerpt") {
            return sortDirection === "asc"
                ? a[sortField].localeCompare(b[sortField])
                : b[sortField].localeCompare(a[sortField]);
        } else if (sortField === "commentCount") {
            return sortDirection === "asc"
                ? a[sortField] - b[sortField]
                : b[sortField] - a[sortField];
        } else if (sortField === "createdAt" || sortField === "updatedAt") {
            // Explicitly handle date fields
            return sortDirection === "asc"
                ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
                : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
        } else if (sortField === "tags") {
            // Handle array fields like tags
            return sortDirection === "asc"
                ? a[sortField].length - b[sortField].length
                : b[sortField].length - a[sortField].length;
        } else {
            // Fallback for any other fields
            return 0;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Blog Posts</h1>
                    <p className="text-gray-500">Create and manage blog content</p>
                </div>
                <Button asChild>
                    <Link href="/admin/content/blog/create">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search posts by title, content, author, or tags..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>            <div className="border rounded-lg overflow-hidden bg-white">
                {isLoading ? (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading blog posts...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-500 mb-2">Error loading blog posts</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">
                                    <button
                                        className="flex items-center"
                                        onClick={() => handleSort("title")}
                                    >
                                        Title
                                        {sortField === "title" && (
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        )}
                                    </button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <button
                                        className="flex items-center"
                                        onClick={() => handleSort("author")}
                                    >
                                        Author
                                        {sortField === "author" && (
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        )}
                                    </button>
                                </TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>AdSense</TableHead>
                                <TableHead>
                                    <button
                                        className="flex items-center"
                                        onClick={() => handleSort("updatedAt")}
                                    >
                                        Last Updated
                                        {sortField === "updatedAt" && (
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        )}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPosts.length > 0 ? (
                                sortedPosts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{post.title}</div>
                                                <div className="text-gray-500 text-sm truncate max-w-xs">{post.excerpt}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.status === "published"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-amber-100 text-amber-800"
                                                }`}>
                                                {post.status === "published" ? "Published" : "Draft"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <User className="h-4 w-4 text-gray-400 mr-1.5" />
                                                <span>{post.author}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {post.tags && post.tags.length > 0 ? post.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                )) : (
                                                    <span className="text-gray-400 text-xs">No tags</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.isAdEnabled
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {post.isAdEnabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                                                <span>{formatDate(post.updatedAt)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border shadow-md">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                        <Link href={`/admin/content/blog/${post.id}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                        <Link href={`/blog/${post.slug}`} target="_blank">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeletePost(post)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No blog posts found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the blog post "{postToDelete?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}