import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
    title: "Product Categories | Uniqverse",
    description: "Browse our diverse range of product categories and find exactly what you're looking for.",
};

async function getCategories() {
    const categories = await db.category.findMany({
        where: {
            parentId: null, // Top-level categories only
        },
        include: {
            children: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return categories;
}

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Product Categories</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Browse our diverse collection of unique products organized by category. Find exactly what you're looking for with ease.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.length > 0 ? (
                    categories.map((category) => (
                        <div
                            key={category.id}
                            className="group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <Link href={`/shop?category=${category.slug}`}>
                                <div className="relative h-48 bg-gray-100">
                                    {category.image ? (
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <span className="text-4xl">📦</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                                        {category.name}
                                    </h2>
                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {category.description || `Browse our collection of ${category.name}`}
                                    </p>

                                    {category.children.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Subcategories:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {category.children.slice(0, 4).map((subcat) => (
                                                    <Link
                                                        key={subcat.id}
                                                        href={`/shop?category=${subcat.slug}`}
                                                        className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-800 transition-colors"
                                                    >
                                                        {subcat.name}
                                                    </Link>
                                                ))}
                                                {category.children.length > 4 && (
                                                    <span className="text-sm text-gray-500">+{category.children.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center text-blue-600 group-hover:text-blue-800">
                                        <span className="font-medium">Browse Products</span>
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    // Show skeletons if no categories are found
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <div className="h-48 bg-gray-200 animate-pulse"></div>
                            <div className="p-6">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}