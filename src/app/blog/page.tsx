"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlogImage } from "@/components/ui/blog-image";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    User: {
        name: string;
        image: string | null;
    };
}

export default function BlogPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchBlogPosts() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/blog-posts?search=${searchQuery}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch blog posts");
                }
                const data = await response.json();

                // Transform data to match BlogPost interface
                const transformedPosts = data.blogPosts.map((post: any) => ({
                    ...post,
                    tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
                }));

                setPosts(transformedPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
                setError(error instanceof Error ? error.message : "Failed to load blog posts");
            } finally {
                setIsLoading(false);
            }
        }

        fetchBlogPosts();
    }, [searchQuery]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Uniqverse Blog</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Stay updated with our latest news, product releases, and industry insights
                </p>
            </div>

            <div className="max-w-md mx-auto mb-8">
                <div className="relative">
                    <Input
                        type="search"
                        placeholder="Search blog posts..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <Card key={post.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                                <Link href={`/blog/${post.slug}`} className="block">                                    <div className="h-48 relative overflow-hidden">
                                    {post.coverImage ? (
                                        <BlogImage
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
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20">
                            <p className="text-gray-500 mb-4">No blog posts found</p>
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
