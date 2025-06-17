"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogImage } from "@/components/ui/blog-image";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
}

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string | null;
    publishedAt: string | null;
    createdAt: string;
    tags: string[];
    User: {
        name: string;
        image: string | null;
    };
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);

    useEffect(() => {
        const initializeParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        initializeParams();
    }, [params]); useEffect(() => {
        if (!resolvedParams?.slug) return;

        async function fetchCategoryAndPosts() {
            setIsLoading(true);
            try {                // Fetch category
                const categoryResponse = await fetch(`/api/blog-categories/slug/${resolvedParams!.slug}`);
                if (!categoryResponse.ok) {
                    if (categoryResponse.status === 404) {
                        throw new Error("Category not found");
                    }
                    throw new Error("Failed to fetch category");
                }

                const categoryData = await categoryResponse.json();
                setCategory(categoryData);

                // Fetch posts for this category
                const postsResponse = await fetch(`/api/blog-posts?category=${categoryData.id}`);
                if (!postsResponse.ok) {
                    throw new Error("Failed to fetch blog posts");
                }

                const postsData = await postsResponse.json();

                // Transform data to match BlogPost interface
                const transformedPosts = postsData.blogPosts.map((post: any) => ({
                    ...post,
                    tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
                }));

                setPosts(transformedPosts);
            } catch (error) {
                console.error("Error:", error);
                setError(error instanceof Error ? error.message : "Failed to load category");
            } finally {
                setIsLoading(false);
            }
        }

        fetchCategoryAndPosts();
    }, [resolvedParams]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }; if (!resolvedParams || isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">{error}</h1>
                <p className="mb-8">The category you're looking for might have been removed or doesn't exist.</p>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
                <p className="mb-8">The category you're looking for might have been removed or doesn't exist.</p>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <Link href="/blog" className="text-primary hover:underline flex items-center mb-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                Back to Blog
            </Link>

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
                {category.description && (
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {category.description}
                    </p>
                )}
            </div>

            {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Card key={post.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                            <Link href={`/blog/${post.slug}`} className="block">
                                <div className="h-48 relative overflow-hidden">
                                    {post.coverImage ? (
                                        <Image
                                            src={post.coverImage}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <CardContent className="flex-grow pt-6">
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                    {post.User && (
                                        <>
                                            <span className="mx-2">•</span>
                                            <User className="h-4 w-4 mr-1" />
                                            <span>{post.User.name}</span>
                                        </>
                                    )}
                                </div>
                                <Link href={`/blog/${post.slug}`}>
                                    <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>
                                </Link>
                                <p className="text-gray-600 line-clamp-3 mb-4">{post.excerpt}</p>

                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {post.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Link href={`/blog/${post.slug}`} className="text-primary hover:underline flex items-center">
                                    Read More
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 ml-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">No blog posts found in this category</p>
                    <Button asChild variant="outline">
                        <Link href="/blog">View All Posts</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
