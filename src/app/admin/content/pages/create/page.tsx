"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreatePagePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        status: "draft",
        content: "",
        metaTitle: "",
        metaDescription: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-generate slug from title if slug is empty
        if (name === "title" && !formData.slug) {
            const slug = value
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");

            setFormData(prev => ({
                ...prev,
                slug
            }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validation
            if (!formData.title.trim()) {
                toast.error("Page title is required");
                setIsSubmitting(false);
                return;
            }

            if (!formData.slug.trim()) {
                toast.error("Page URL slug is required");
                setIsSubmitting(false);
                return;
            }

            if (!formData.content.trim()) {
                toast.error("Page content is required");
                setIsSubmitting(false);
                return;
            }

            // Here you would normally make an API call to create the page
            // For now, we'll just simulate a successful creation

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success(`Page "${formData.title}" created successfully`);

            // Redirect to pages list
            router.push("/admin/content/pages");
        } catch (error) {
            console.error("Error creating page:", error);
            toast.error("Failed to create page. Please try again.");
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
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange("status", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-gray-500">
                                        Draft pages are not visible to the public
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>Saving...</>
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
                                    <Label htmlFor="metaDescription">Meta Description</Label>
                                    <Textarea
                                        id="metaDescription"
                                        name="metaDescription"
                                        value={formData.metaDescription}
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
                    </div>
                </div>
            </form>
        </div>
    );
}