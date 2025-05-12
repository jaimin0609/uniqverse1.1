"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-provider";

export function ThemeToggle({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const { theme, setTheme } = useTheme();

    return (
        <div className={`flex items-center space-x-2 ${className}`} {...props}>
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
            >
                {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </button>
        </div>
    );
}