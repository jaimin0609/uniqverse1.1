"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { ProductSearchParams } from "@/app/shop/page";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
    <nav
        role="navigation"
        aria-label="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
    />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
    HTMLUListElement,
    React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
    <ul
        ref={ref}
        className={cn("flex flex-row items-center gap-1", className)}
        {...props}
    />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
    isActive?: boolean;
} & Pick<ButtonProps, "size"> &
    React.ComponentProps<"a">;

const PaginationLink = ({
    className,
    isActive,
    size = "icon",
    ...props
}: PaginationLinkProps) => (
    <a
        aria-current={isActive ? "page" : undefined}
        className={cn(
            buttonVariants({
                variant: isActive ? "outline" : "ghost",
                size,
            }),
            className
        )}
        {...props}
    />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to previous page"
        size="default"
        className={cn("gap-1 pl-2.5", className)}
        {...props}
    >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
    </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to next page"
        size="default"
        className={cn("gap-1 pr-2.5", className)}
        {...props}
    >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
    </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
    className,
    ...props
}: React.ComponentProps<"span">) => (
    <span
        aria-hidden
        className={cn("flex h-9 w-9 items-center justify-center", className)}
        {...props}
    >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More pages</span>
    </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    searchParams: Record<string, string | string[]>;
    basePath?: string; // Add optional basePath parameter
}

export function PaginationComponent({
    totalPages,
    currentPage,
    searchParams,
    basePath = "/shop", // Default to /shop if no basePath provided
}: PaginationProps) {    // Generate the URL for a specific page while preserving other query params
    const getPageUrl = (page: number) => {
        const current = new URLSearchParams();

        // Safely process searchParams
        Object.entries(searchParams || {}).forEach(([key, value]) => {
            if (key !== "page") {
                if (Array.isArray(value)) {
                    value.forEach(v => current.append(key, v));
                } else {
                    current.append(key, value);
                }
            }
        });

        current.set("page", page.toString());
        return `${basePath}?${current.toString()}`;
    };

    // Calculate the range of page numbers to display
    const getPageNumbers = () => {
        const delta = 1; // Number of pages to show before and after current page
        const pages: (number | string)[] = [];

        // Always include first page
        pages.push(1);

        // Calculate start and end pages to display
        const startPage = Math.max(2, currentPage - delta);
        const endPage = Math.min(totalPages - 1, currentPage + delta);

        // Add ellipsis if there's a gap after the first page
        if (startPage > 2) {
            pages.push("...");
        }

        // Add page numbers between start and end
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Add ellipsis if there's a gap before the last page
        if (endPage < totalPages - 1) {
            pages.push("...");
        }

        // Always include last page if there's more than one page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    // Don't render pagination if there's only one page
    if (totalPages <= 1) {
        return null;
    }

    return (
        <Pagination className="py-8">
            <PaginationContent>
                {/* Previous page button */}
                <PaginationItem>
                    <PaginationPrevious
                        href={getPageUrl(currentPage - 1)}
                        className={cn(currentPage <= 1 && "opacity-50 cursor-not-allowed")}
                        aria-disabled={currentPage <= 1}
                    />
                </PaginationItem>

                {/* Page numbers */}
                {getPageNumbers().map((page, i) => {
                    if (page === "...") {
                        return (
                            <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    const pageNumber = page as number;
                    const isCurrentPage = pageNumber === currentPage;

                    return (
                        <PaginationItem key={pageNumber}>
                            <PaginationLink
                                href={getPageUrl(pageNumber)}
                                isActive={isCurrentPage}
                            >
                                {pageNumber}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                {/* Next page button */}
                <PaginationItem>
                    <PaginationNext
                        href={getPageUrl(currentPage + 1)}
                        className={cn(
                            currentPage >= totalPages && "opacity-50 cursor-not-allowed"
                        )}
                        aria-disabled={currentPage >= totalPages}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
};