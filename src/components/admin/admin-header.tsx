"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface AdminHeaderProps {
    title: string;
    description?: string;
    backLink?: string;
    children?: ReactNode;
}

export function AdminHeader({ title, description, backLink, children }: AdminHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="space-y-1">
                {backLink && (
                    <Link
                        href={backLink}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Link>
                )}
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}
