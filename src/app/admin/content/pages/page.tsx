"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FileText, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Calendar,
    User, ArrowUpDown, ChevronDown, Loader2, AlertCircle, RefreshCw
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
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PageData {
    id: string;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    metaTitle?: string;
    metaDesc?: string;
    isAdEnabled: boolean;
    externalLinks: Array<{ title: string; url: string }>;
    createdAt: string;
    updatedAt: string;
    author: string;
}

export default function PagesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [pages, setPages] = useState<PageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<PageData | null>(null);
    const [sortField, setSortField] = useState<keyof PageData>("updatedAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [isDeleting, setIsDeleting] = useState(false);
    
    useEffect(() => {
        const fetchPages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/pages?search=${searchQuery}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch pages');
                }
                
                const data = await response.json();
                setPages(data);
            } catch (err) {
                console.error('Error fetching pages:', err);
                setError('Failed to load pages. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchPages();
    }, [searchQuery]);
    
    const handleSort = (field: keyof PageData) => {
        const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortDirection(newDirection);
    };
    
    const handleDeletePage = (page: PageData) => {
        setPageToDelete(page);
        setDeleteDialogOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!pageToDelete) return;
        
        setIsDeleting(true);
        
        try {
            const response = await fetch(`/api/admin/pages/${pageToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete page');
            }
            
            setPages(pages.filter(page => page.id !== pageToDelete.id));
            toast.success(`Page "${pageToDelete.title}" deleted successfully`);
            setDeleteDialogOpen(false);
            setPageToDelete(null);
        } catch (err) {
            console.error('Error deleting page:', err);
            toast.error('Failed to delete page. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };
    
    // Filter pages based on search query
    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort pages
    const sortedPages = [...filteredPages].sort((a, b) => {
        if (sortField === "title" || sortField === "slug" || sortField === "author") {
            return sortDirection === "asc"
                ? a[sortField].localeCompare(b[sortField])
                : b[sortField].localeCompare(a[sortField]);
        } else if (sortField === "createdAt" || sortField === "updatedAt") {
            return sortDirection === "asc"
                ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
                : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
        } else {
            // Fallback for any other fields
            return 0;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Pages</h1>
                    <p className="text-gray-500">Create and manage site pages</p>
                </div>
                <Button asChild>
                    <Link href="/admin/content/pages/create">
                        <Plus className="h-4 w-4 mr-2" />
                        New Page
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search pages..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-500">Loading pages...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-center mb-4">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
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
                        {sortedPages.length > 0 ? (
                            sortedPages.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{page.title}</div>
                                            <div className="text-gray-500 text-sm">{page.slug}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                page.isPublished
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {page.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{page.author}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                page.isAdEnabled
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {page.isAdEnabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(page.updatedAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <span className="sr-only">Open menu</span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-5 h-5"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                                                        />
                                                    </svg>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/admin/content/pages/${page.id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={`/${page.slug}`} target="_blank">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeletePage(page)}
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
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No pages found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Page</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the page "{pageToDelete?.title}"?
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
                            onClick={confirmDelete}
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
