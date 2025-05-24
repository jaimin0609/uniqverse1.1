"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ExternalLink {
    title: string;
    url: string;
}

interface PageFormData {
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    metaTitle: string;
    metaDesc: string;
    externalLinks: ExternalLink[];
}

export default function CreatePagePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<PageFormData>({
        title: "",
        slug: "",
        content: "",
        isPublished: false,
        metaTitle: "",
        metaDesc: "",
        externalLinks: [],
    });
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle switch toggle
    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, isPublished: checked }));
    };

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title && !formData.slug) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/--+/g, "-")
                .trim();
            setFormData((prev) => ({ ...prev, slug }));
        }
    }, [formData.title, formData.slug]);

    // Add external link
    const addExternalLink = () => {
        if (newLinkTitle && newLinkUrl) {
            let url = newLinkUrl;
            if (!url.startsWith("http")) {
                url = `https://${url}`;
            }

            try {
                // Validate URL
                new URL(url);
                const newLink = { title: newLinkTitle, url };
                setFormData((prev) => ({
                    ...prev,
                    externalLinks: [...prev.externalLinks, newLink],
                }));
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
        setFormData((prev) => ({
            ...prev,
            externalLinks: prev.externalLinks.filter((_, i) => i !== index),
        }));
    };

    // Form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Basic validation
            if (!formData.title) throw new Error("Title is required");
            if (!formData.slug) throw new Error("Slug is required");
            if (!formData.content || formData.content.length < 10)
                throw new Error("Content must be at least 10 characters");

            const response = await fetch("/api/admin/pages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create page");
            }

            const result = await response.json();
            toast.success(`Page "${formData.title}" created successfully`);

            // Redirect to pages list
            router.push("/admin/content/pages");
        } catch (error) {
            console.error("Error creating page:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create page. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/content/pages">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Pages
                        </Link>
                    </Button>
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Create New Page</h1>
                <p className="text-gray-500">Create a new static page for your website</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Page Content</CardTitle>
                                <CardDescription>
                                    The main content of your page
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Page Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter page title"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL Slug</Label>
                                    <div className="flex items-center">
                                        <span className="text-gray-500 mr-2">/</span>
                                        <Input
                                            id="slug"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleChange}
                                            placeholder="page-url-slug"
                                            required
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        The URL-friendly version of the name. This will form the URL of the page.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Enter page content"
                                        className="min-h-[300px] font-mono"
                                        required
                                    />
                                    <p className="text-sm text-gray-500">
                                        You can use HTML tags for formatting
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Page Settings</CardTitle>
                                <CardDescription>
                                    Configure page publishing options
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isPublished">Published</Label>
                                        <p className="text-sm text-gray-500">
                                            Make this page visible to the public
                                        </p>
                                    </div>
                                    <Switch
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onCheckedChange={handleSwitchChange}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Page
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>SEO</CardTitle>
                                <CardDescription>
                                    Search engine optimization settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="metaTitle">Meta Title</Label>
                                    <Input
                                        id="metaTitle"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleChange}
                                        placeholder="Page title for search engines"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Defaults to the page title if left empty
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="metaDesc">Meta Description</Label>
                                    <Textarea
                                        id="metaDesc"
                                        name="metaDesc"
                                        value={formData.metaDesc}
                                        onChange={handleChange}
                                        placeholder="Brief description for search results"
                                        className="h-20"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Keep it under 160 characters for best results
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>External Links</CardTitle>
                                <CardDescription>
                                    Add related external links to this page
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="linkTitle">Link Title</Label>
                                    <Input
                                        id="linkTitle"
                                        value={newLinkTitle}
                                        onChange={(e) => setNewLinkTitle(e.target.value)}
                                        placeholder="Enter link title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkUrl">Link URL</Label>
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
                                    className="w-full"
                                    onClick={addExternalLink}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Link
                                </Button>

                                {formData.externalLinks.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        <Label>Added Links</Label>
                                        {formData.externalLinks.map((link, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 border rounded-md"
                                            >
                                                <div className="truncate mr-2">
                                                    <div className="font-medium">{link.title}</div>
                                                    <div className="text-sm text-gray-500 truncate">{link.url}</div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeExternalLink(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}

