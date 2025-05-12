"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BookOpen, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Calendar,
    User, ArrowUpDown, Tag, MessageSquare
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
}

export default function BlogPostsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState<BlogPostData[]>([
        {
            id: "post-1",
            title: "Top 10 Custom Design Trends for 2025",
            slug: "/blog/top-10-custom-design-trends",
            status: "published",
            createdAt: "2025-04-28T09:30:00Z",
            updatedAt: "2025-05-02T09:15:00Z",
            author: "Sarah Johnson",
            excerpt: "Discover the hottest design trends shaping the custom product landscape in 2025.",
            tags: ["design", "trends", "2025"],
            commentCount: 12
        },
        {
            id: "post-2",
            title: "How to Care for Custom Products",
            slug: "/blog/how-to-care-for-custom-products",
            status: "published",
            createdAt: "2025-04-20T11:45:00Z",
            updatedAt: "2025-04-28T11:20:00Z",
            author: "Sarah Johnson",
            excerpt: "Learn the best practices for maintaining and extending the life of your custom products.",
            tags: ["care", "maintenance", "products"],
            commentCount: 8
        },
        {
            id: "post-3",
            title: "Customer Spotlight: Amazing Transformations",
            slug: "/blog/customer-spotlight-transformations",
            status: "published",
            createdAt: "2025-04-15T14:20:00Z",
            updatedAt: "2025-04-25T15:30:00Z",
            author: "James Smith",
            excerpt: "See how our customers have transformed their spaces with our custom products.",
            tags: ["customers", "showcase", "transformations"],
            commentCount: 15
        },
        {
            id: "post-4",
            title: "Behind the Scenes: Our Design Process",
            slug: "/blog/behind-the-scenes-design-process",
            status: "published",
            createdAt: "2025-04-10T10:15:00Z",
            updatedAt: "2025-04-22T16:45:00Z",
            author: "Sarah Johnson",
            excerpt: "Take a peek behind the curtain and see how we create our unique designs.",
            tags: ["design", "process", "behind-the-scenes"],
            commentCount: 7
        },
        {
            id: "post-5",
            title: "Sustainable Materials in Custom Products",
            slug: "/blog/sustainable-materials",
            status: "published",
            createdAt: "2025-04-05T09:20:00Z",
            updatedAt: "2025-04-20T12:30:00Z",
            author: "James Smith",
            excerpt: "Learn about our commitment to sustainability and the eco-friendly materials we use.",
            tags: ["sustainability", "materials", "eco-friendly"],
            commentCount: 9
        },
        {
            id: "post-6",
            title: "Gift Guide: Custom Products for Every Occasion",
            slug: "/blog/gift-guide-custom-products",
            status: "published",
            createdAt: "2025-03-30T13:40:00Z",
            updatedAt: "2025-04-18T10:20:00Z",
            author: "Sarah Johnson",
            excerpt: "Find the perfect custom gift for any celebration with our comprehensive guide.",
            tags: ["gifts", "occasions", "guide"],
            commentCount: 4
        },
        {
            id: "post-7",
            title: "Upcoming Product Line Sneak Peek",
            slug: "/blog/upcoming-product-line",
            status: "draft",
            createdAt: "2025-04-25T15:10:00Z",
            updatedAt: "2025-05-01T11:45:00Z",
            author: "James Smith",
            excerpt: "Get an exclusive first look at our exciting new product line launching next month.",
            tags: ["products", "new", "preview"],
            commentCount: 0
        },
        {
            id: "post-8",
            title: "Designer Interview: Meeting the Minds",
            slug: "/blog/designer-interview",
            status: "draft",
            createdAt: "2025-04-27T16:30:00Z",
            updatedAt: "2025-05-01T14:20:00Z",
            author: "Sarah Johnson",
            excerpt: "Meet the creative team behind our most popular custom designs.",
            tags: ["designers", "interview", "creative"],
            commentCount: 0
        },
        {
            id: "post-9",
            title: "Custom Product Photography Tips",
            slug: "/blog/photography-tips",
            status: "published",
            createdAt: "2025-03-25T11:20:00Z",
            updatedAt: "2025-04-15T09:30:00Z",
            author: "James Smith",
            excerpt: "Learn how to capture your custom products in the best light with these photography tips.",
            tags: ["photography", "tips", "products"],
            commentCount: 6
        },
        {
            id: "post-10",
            title: "Customer Stories: Why Personalization Matters",
            slug: "/blog/customer-stories-personalization",
            status: "published",
            createdAt: "2025-03-20T09:45:00Z",
            updatedAt: "2025-04-10T14:15:00Z",
            author: "Sarah Johnson",
            excerpt: "Hear from our customers about why personalization makes all the difference.",
            tags: ["customers", "personalization", "stories"],
            commentCount: 11
        },
        {
            id: "post-11",
            title: "Color Psychology in Custom Designs",
            slug: "/blog/color-psychology",
            status: "published",
            createdAt: "2025-03-15T14:30:00Z",
            updatedAt: "2025-04-05T11:25:00Z",
            author: "James Smith",
            excerpt: "Understand how colors influence emotions and how to use them effectively in custom designs.",
            tags: ["color", "psychology", "design"],
            commentCount: 13
        },
        {
            id: "post-12",
            title: "From Concept to Creation: Custom Product Journey",
            slug: "/blog/concept-to-creation",
            status: "published",
            createdAt: "2025-03-10T10:00:00Z",
            updatedAt: "2025-04-02T15:40:00Z",
            author: "Sarah Johnson",
            excerpt: "Follow the journey of a custom product from initial idea to finished item.",
            tags: ["process", "creation", "journey"],
            commentCount: 5
        }
    ]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPostData | null>(null);
    const [sortField, setSortField] = useState<keyof BlogPostData>("updatedAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
    };

    const handleDeletePost = (post: BlogPostData) => {
        setPostToDelete(post);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (postToDelete) {
            // Here you would normally make an API call to delete the post
            // For now, we'll just update the state
            setPosts(posts.filter(post => post.id !== postToDelete.id));
            toast.success(`Blog post "${postToDelete.title}" deleted successfully`);
            setDeleteDialogOpen(false);
            setPostToDelete(null);
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
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
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
                            <TableHead>
                                <button
                                    className="flex items-center"
                                    onClick={() => handleSort("commentCount")}
                                >
                                    Comments
                                    {sortField === "commentCount" && (
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    )}
                                </button>
                            </TableHead>
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
                                            {post.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <MessageSquare className="h-4 w-4 text-gray-400 mr-1.5" />
                                            <span>{post.commentCount}</span>
                                        </div>
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
                                                    <Link href={post.slug} target="_blank">
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