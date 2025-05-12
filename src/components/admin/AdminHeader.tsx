import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

/**
 * Reusable header component for admin pages
 */
const AdminHeader: React.FC<AdminHeaderProps> = ({
    title,
    description,
    actions,
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};

export default AdminHeader;