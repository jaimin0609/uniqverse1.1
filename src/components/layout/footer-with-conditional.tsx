"use client";

import { usePathname } from 'next/navigation';

export default function FooterWithConditional() {
    const pathname = usePathname();

    // Don't render footer on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="bg-gray-100 py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="text-center text-gray-500">
                    <p>© {new Date().getFullYear()} UselfUnik. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}