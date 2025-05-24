"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const blogCategorySchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    slug: z.string().min(2, { message: "Slug must be at least 2 characters" }).regex(/^[a-z0-9-]+$/, {
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
    description: z.string().optional(),
});

type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;

export default function CreateBlogCategoryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BlogCategoryFormValues>({
        resolver: zodResolver(blogCategorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
        },
    });

    // Watch name for auto-generating slug
    const name = form.watch("name");    // Auto-generate slug from title
    useEffect(() => {
        if (name && !form.getValues("slug")) {
            const slug = name
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/--+/g, "-")
                .trim();
            form.setValue("slug", slug);
        }
    }, [name, form]);

    const onSubmit = async (values: BlogCategoryFormValues) => {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/blog-categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create blog category");
            }

            toast.success("Blog category created successfully");
            router.push("/admin/content/blog-categories");
        } catch (error) {
            console.error("Error creating blog category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create blog category");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">Create Blog Category</h1>
                </div>
            </div>

            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Category Details</CardTitle>
                            <CardDescription>
                                Create a new category to organize your blog posts.
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
                                            The URL-friendly version of the name. Auto-generated from name.
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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Category
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
