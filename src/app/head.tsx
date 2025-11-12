import type { Metadata } from "next";

export default function Head() {
    return (
        <>
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="icon" href="/favicon-16x16.svg" sizes="16x16" type="image/svg+xml" />
            <link rel="icon" href="/favicon.svg" sizes="32x32" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/uselfunik-app-icon.svg" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#2563eb" />
        </>
    );
}