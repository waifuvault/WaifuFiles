import "./globals.css";
import type { Metadata, Viewport } from "next";
import React from "react";

const opts = {
    description: "Fast, and easy file uploader for WaifuVault",
    title: "WaifuVault Uploader - Fast File Upload",
};

export const metadata: Metadata = {
    ...opts,
    keywords: ["file upload", "waifuvault", "temporary hosting", "drag and drop", "file sharing"],
    authors: [{ name: "Victoria" }],
    openGraph: {
        ...opts,
        type: "website",
        url: "https://upload.waifuvault.moe",
        siteName: "WaifuVault Uploader",
        images: [
            {
                url: "https://waifuvault.moe/assets/custom/images/vic_vault.webp",
                width: 300,
                height: 335,
                alt: "WaifuVault Uploader",
                type: "image/webp",
            },
        ],
    },
    twitter: {
        ...opts,
        card: "summary_large_image",
        images: ["https://waifuvault.moe/assets/custom/images/vic_vault.webp"],
    },
    icons: {
        icon: "/favicon.ico", // Only if you have this file
        shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#667eea" />
            </head>
            <body>{children}</body>
        </html>
    );
}
