import './globals.css'
import type {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'WaifuVault Uploader - Fast File Upload',
    description: 'fast, and easy file uploader for WaifuVault temporary file hosting',
    keywords: ['file upload', 'waifuvault', 'temporary hosting', 'drag and drop', 'file sharing'],
    authors: [{ name: 'Victoria' }],
    openGraph: {
        type: 'website',
        title: 'WaifuVault Uploader - Fast File Upload',
        url: 'https://upload.waifuvault.moe',
        siteName: 'WaifuVault Uploader',
        description: 'fast, and easy file uploader for WaifuVault temporary file hosting',
        images: [
            {
                url: 'https://waifuvault.moe/assets/custom/images/vic_vault.webp',
                width: 300,
                height: 335,
                alt: 'WaifuVault Uploader',
                type: 'image/webp'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'WaifuVault Uploader - Fast File Upload',
        description: 'fast, and easy file uploader for WaifuVault temporary file hosting',
        images: ['https://waifuvault.moe/assets/custom/images/vic_vault.webp']
    },
    viewport: 'width=device-width, initial-scale=1',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '32x32' },
            { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
            { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180' }
        ],
        shortcut: '/favicon.ico'
    },
    manifest: '/site.webmanifest'
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/favicon.ico" sizes="32x32" />
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/site.webmanifest" />
            <meta name="theme-color" content="#667eea" />
        </head>
        <body>{children}</body>
        </html>
    )
}