"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Tag, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlogImage } from "@/components/ui/blog-image";
import { BlogContent } from "@/components/ui/blog-content";
import { SocialShare } from "@/components/ui/social-share";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    metaTitle: string | null;
    metaDesc: string | null;
    tags: string[];
    isAdEnabled: boolean;
    externalLinks: any | null;
    User: {
        name: string;
        image: string | null;
    };
    BlogCategory: {
        id: string;
        name: string;
        slug: string;
    }[];
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchBlogPost() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/blog-posts/slug/${resolvedParams.slug}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Blog post not found");
                    }
                    throw new Error("Failed to fetch blog post");
                }

                const data = await response.json();

                // Transform data to match BlogPost interface
                setPost({
                    ...data,
                    tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
                });

                // Fetch related posts if we have this post's categories
                if (data.BlogCategory && data.BlogCategory.length > 0) {
                    const categoryIds = data.BlogCategory.map((cat: any) => cat.id);
                    fetchRelatedPosts(categoryIds, data.id);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
                setError(error instanceof Error ? error.message : "Failed to load blog post");
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchRelatedPosts(categoryIds: string[], excludePostId: string) {
            try {
                const queryParams = new URLSearchParams({
                    categories: categoryIds.join(','),
                    exclude: excludePostId,
                    limit: '3'
                });

                const response = await fetch(`/api/blog-posts/related?${queryParams.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setRelatedPosts(data.blogPosts || []);
                }
            } catch (error) {
                console.error("Error fetching related posts:", error);
            }
        } fetchBlogPost();
    }, [resolvedParams.slug]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    if (isLoading) {
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
                <p className="mb-8">The blog post you're looking for might have been removed or doesn't exist.</p>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
                <p className="mb-8">The blog post you're looking for might have been removed or doesn't exist.</p>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
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

                {post.BlogCategory && post.BlogCategory.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.BlogCategory.map((category) => (
                            <Link key={category.id} href={`/blog/category/${category.slug}`}>
                                <Badge variant="secondary" className="capitalize">
                                    {category.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                )}

                <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

                <div className="flex items-center text-sm text-gray-500 mb-8">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>

                    {post.User && (
                        <>
                            <span className="mx-2">•</span>
                            <User className="h-4 w-4 mr-1" />
                            <span>{post.User.name}</span>
                        </>)}

                    <SocialShare
                        title={post.title}
                        description={post.excerpt || undefined}
                        hashtags={post.tags}
                        className="ml-auto"
                        variant="ghost"
                        size="sm"
                    />
                </div>

                {post.coverImage && (
                    <div className="mb-8 relative aspect-video w-full overflow-hidden rounded-lg">
                        <BlogImage
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 800px"
                            priority
                        />
                    </div>
                )}

                {post.excerpt && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-8 text-lg text-gray-700 leading-relaxed italic">
                        {post.excerpt}
                    </div>
                )}
                <BlogContent
                    content={post.content}
                    className="mb-12"
                    isMarkdown={Boolean(post.content && post.content.includes('# ') && post.content.includes('```'))}
                />

                {post.externalLinks && post.externalLinks.length > 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-8">
                        <h3 className="text-lg font-semibold mb-4">Related Links</h3>
                        <ul className="space-y-2">
                            {post.externalLinks.map((link: any, index: number) => (
                                <li key={index}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center"
                                    >
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
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        {link.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                                    <Badge variant="outline">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {relatedPosts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-16">
                    <Separator className="mb-8" />
                    <h2 className="text-2xl font-bold mb-6">You might also like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {relatedPosts.map((relatedPost) => (
                            <Card key={relatedPost.id} className="overflow-hidden">
                                <Link href={`/blog/${relatedPost.slug}`} className="block">                                    <div className="h-40 relative">
                                    {relatedPost.coverImage ? (
                                        <BlogImage
                                            src={relatedPost.coverImage}
                                            alt={relatedPost.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                </div>
                                </Link>
                                <CardContent className="pt-4">
                                    <Link href={`/blog/${relatedPost.slug}`}>
                                        <h3 className="font-semibold hover:text-primary transition-colors">{relatedPost.title}</h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{relatedPost.excerpt}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
