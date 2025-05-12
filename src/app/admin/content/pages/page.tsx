"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FileText, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Calendar,
    User, ArrowUpDown, ChevronDown
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PageData {
    id: string;
    title: string;
    slug: string;
    status: "published" | "draft";
    createdAt: string;
    updatedAt: string;
    author: string;
}

export default function PagesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [pages, setPages] = useState<PageData[]>([
        {
            id: "page-1",
            title: "Home",
            slug: "/",
            status: "published",
            createdAt: "2025-03-10T14:30:00Z",
            updatedAt: "2025-04-25T09:15:00Z",
            author: "James Smith"
        },
        {
            id: "page-2",
            title: "About Us",
            slug: "/about",
            status: "published",
            createdAt: "2025-03-12T10:45:00Z",
            updatedAt: "2025-04-30T14:32:00Z",
            author: "James Smith"
        },
        {
            id: "page-3",
            title: "Contact",
            slug: "/contact",
            status: "published",
            createdAt: "2025-03-15T11:20:00Z",
            updatedAt: "2025-04-20T15:40:00Z",
            author: "Sarah Johnson"
        },
        {
            id: "page-4",
            title: "Privacy Policy",
            slug: "/privacy",
            status: "published",
            createdAt: "2025-03-18T09:30:00Z",
            updatedAt: "2025-04-29T16:45:00Z",
            author: "James Smith"
        },
        {
            id: "page-5",
            title: "Terms of Service",
            slug: "/terms",
            status: "published",
            createdAt: "2025-03-20T13:15:00Z",
            updatedAt: "2025-04-15T10:20:00Z",
            author: "James Smith"
        },
        {
            id: "page-6",
            title: "Shipping Information",
            slug: "/shipping",
            status: "published",
            createdAt: "2025-03-25T14:50:00Z",
            updatedAt: "2025-04-10T11:30:00Z",
            author: "Sarah Johnson"
        },
        {
            id: "page-7",
            title: "Returns & Exchanges",
            slug: "/returns",
            status: "published",
            createdAt: "2025-04-02T10:10:00Z",
            updatedAt: "2025-04-18T14:25:00Z",
            author: "Sarah Johnson"
        },
        {
            id: "page-8",
            title: "Help Center",
            slug: "/help",
            status: "draft",
            createdAt: "2025-04-10T15:20:00Z",
            updatedAt: "2025-04-22T12:50:00Z",
            author: "James Smith"
        }
    ]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<PageData | null>(null);
    const [sortField, setSortField] = useState<keyof PageData>("updatedAt");
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

    const handleSort = (field: keyof PageData) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleDeletePage = (page: PageData) => {
        setPageToDelete(page);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (pageToDelete) {
            // Here you would normally make an API call to delete the page
            // For now, we'll just update the state
            setPages(pages.filter(page => page.id !== pageToDelete.id));
            toast.success(`Page "${pageToDelete.title}" deleted successfully`);
            setDeleteDialogOpen(false);
            setPageToDelete(null);
        }
    };

    // Filter pages based on search query
    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort pages
    const sortedPages = [...filteredPages].sort((a, b) => {
        if (sortField === "title" || sortField === "slug" || sortField === "author") {
            return sortDirection === "asc"
                ? a[sortField].localeCompare(b[sortField])
                : b[sortField].localeCompare(a[sortField]);
        } else {
            return sortDirection === "asc"
                ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
                : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Pages</h1>
                    <p className="text-gray-500">Manage your website's static pages</p>
                </div>
                <Button asChild>
                    <Link href="/admin/content/pages/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Page
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search pages..."
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
                            <TableHead>
                                <button
                                    className="flex items-center"
                                    onClick={() => handleSort("slug")}
                                >
                                    URL
                                    {sortField === "slug" && (
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
                                    <TableCell className="font-medium">{page.title}</TableCell>
                                    <TableCell>
                                        <span className="text-gray-500 text-sm">{page.slug}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.status === "published"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}>
                                            {page.status === "published" ? "Published" : "Draft"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <User className="h-4 w-4 text-gray-400 mr-1.5" />
                                            <span>{page.author}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                                            <span>{formatDate(page.updatedAt)}</span>
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
                                                    <Link href={`/admin/content/pages/${page.id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-gray-100">
                                                    <Link href={page.slug} target="_blank">
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
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Page</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the page "{pageToDelete?.title}"? This action cannot be undone.
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