"use client";

import React, { ReactNode } from "react";
import { FolderPlus } from "lucide-react";

interface AdminEmptyStateProps {
    title: string;
    description: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export function AdminEmptyState({
    title,
    description,
    icon,
    action,
}: AdminEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px] bg-gray-50 rounded-lg border border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                {icon || <FolderPlus className="h-6 w-6 text-gray-400" />}
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-gray-500 max-w-md mt-1 mb-4">{description}</p>
            {action}
        </div>
    );
}
