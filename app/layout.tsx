import "./globals.css";
import "./themes.css";
import type { Metadata, Viewport } from "next";
import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import "bootstrap-icons/font/bootstrap-icons.css";

const opts = {
    description: "Fast, and easy file uploader for WaifuVault",
    title: "WaifuVault Uploader - Fast File Upload",
};

export const metadata: Metadata = {
    ...opts,
    authors: [{ name: "Victoria" }],
    icons: {
        apple: "/favicon.svg",
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
    keywords: ["file upload", "waifuvault", "temporary hosting", "drag and drop", "file sharing"],
    manifest: "/site.webmanifest",
    openGraph: {
        ...opts,
        images: [
            {
                alt: "WaifuVault Uploader",
                height: 335,
                type: "image/webp",
                url: "https://waifuvault.moe/assets/custom/images/vic_vault.webp",
                width: 300,
            },
        ],
        siteName: "WaifuVault Uploader",
        type: "website",
        url: "https://upload.waifuvault.moe",
    },
    twitter: {
        ...opts,
        card: "summary_large_image",
        images: ["https://waifuvault.moe/assets/custom/images/vic_vault.webp"],
    },
};

export const viewport: Viewport = {
    initialScale: 1,
    width: "device-width",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
                <link href="/site.webmanifest" rel="manifest" />
                <meta content="#667eea" name="theme-color" />
            </head>
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
