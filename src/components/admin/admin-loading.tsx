"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export function AdminLoading() {
    return (
        <div className="flex items-center justify-center h-40 w-full">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        </div>
    );
}
