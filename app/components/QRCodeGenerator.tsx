"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import styles from "./QRCodeGenerator.module.css";
import { ThemeType } from "@/app/constants/theme";
import { useTheme } from "@/app/contexts/ThemeContext";

interface QRCodeGeneratorProps {
    url: string;
    fileName: string;
    onClose: () => void;
    embedded?: boolean;
}

export default function QRCodeGenerator({ url, fileName, onClose, embedded = false }: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const { currentTheme: theme, getThemeClass } = useTheme();

    useEffect(() => {
        const getThemeColors = () => {
            switch (theme) {
                case ThemeType.STEAMPUNK:
                    return {
                        foreground: "#cd7f32",
                        background: "#f4e4bc",
                    };
                case ThemeType.CYBERPUNK:
                    return {
                        foreground: "#00ffff",
                        background: "#000000",
                    };
                case ThemeType.GREEN_PHOSPHOR:
                    return {
                        foreground: "#00ff00",
                        background: "#000000",
                    };
                case ThemeType.ORANGE_PHOSPHOR:
                    return {
                        foreground: "#ffa500",
                        background: "#000000",
                    };
                case ThemeType.MINIMAL:
                    return {
                        foreground: "#000000",
                        background: "#ffffff",
                    };
                case ThemeType.DEFAULT:
                default:
                    return {
                        foreground: "#667eea",
                        background: "#ffffff",
                    };
            }
        };

        const generateQRCode = async () => {
            if (!canvasRef.current) {
                return;
            }

            setIsGenerating(true);
            setError(null);

            try {
                const colors = getThemeColors();

                await QRCode.toCanvas(canvasRef.current, url, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: colors.foreground,
                        light: colors.background,
                    },
                });

                setIsGenerating(false);
            } catch (err) {
                console.error("Failed to generate QR code:", err);
                setError("Failed to generate QR code");
                setIsGenerating(false);
            }
        };

        generateQRCode();
    }, [url, theme]);

    const handleDownload = () => {
        if (!canvasRef.current) {
            return;
        }

        try {
            const link = document.createElement("a");
            link.download = `${fileName.replace(/\.[^/.]+$/, "")}_qr.png`;
            link.href = canvasRef.current.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 2000);
        } catch (err) {
            console.error("Failed to download QR code:", err);
            setError("Failed to download QR code");
        }
    };

    const handleCopyToClipboard = async () => {
        if (!canvasRef.current) {
            return;
        }

        try {
            const canvas = canvasRef.current;
            canvas.toBlob(async blob => {
                if (blob) {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }, "image/png");
        } catch (err) {
            console.error("Failed to copy QR code:", err);
            setError("Failed to copy QR code to clipboard");
        }
    };

    const themeClass = getThemeClass();

    const content = (
        <>
            <div className={styles.qrContainer} style={{ display: isGenerating || error ? "none" : "block" }}>
                <canvas ref={canvasRef} className={styles.qrCode} />
                <div className={styles.qrOverlay}>
                    <div className={styles.qrInfo}>
                        <i className="bi-link-45deg" aria-hidden="true"></i>
                        <span className={styles.urlPreview}>{url.length > 40 ? `${url.slice(0, 37)}...` : url}</span>
                    </div>
                </div>
            </div>

            {isGenerating && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>{theme === ThemeType.STEAMPUNK ? "Engraving brass plate..." : "Generating QR code..."}</span>
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    <i className="bi-exclamation-triangle" aria-hidden="true"></i>
                    <span>{error}</span>
                </div>
            )}

            {!isGenerating && !error && (
                <>
                    <div className={styles.actions}>
                        <button
                            className={`${styles.actionButton} ${styles.downloadButton} ${downloaded ? styles.downloaded : ""} ${styles[themeClass]}`}
                            onClick={handleDownload}
                        >
                            <i className={downloaded ? "bi-check-circle-fill" : "bi-download"} aria-hidden="true"></i>
                            {downloaded
                                ? "Downloaded!"
                                : theme === ThemeType.STEAMPUNK
                                  ? "Save Brass Plate"
                                  : "Download PNG"}
                        </button>

                        <button
                            className={`${styles.actionButton} ${styles.copyButton} ${copied ? styles.copied : ""} ${styles[themeClass]}`}
                            onClick={handleCopyToClipboard}
                        >
                            <i className={copied ? "bi-check-circle-fill" : "bi-clipboard"} aria-hidden="true"></i>
                            {copied ? "Copied!" : "Copy to Clipboard"}
                        </button>
                    </div>

                    <div className={styles.info}>
                        <p className={styles.infoText}>
                            <i className="bi-info-circle" aria-hidden="true"></i>
                            {theme === ThemeType.STEAMPUNK
                                ? "Scan this brass-engraved code to access your stored file"
                                : "Scan this QR code to access your uploaded file"}
                        </p>
                    </div>
                </>
            )}
        </>
    );

    if (embedded) {
        return <div className={styles[themeClass]}>{content}</div>;
    }

    return (
        <div className={`${styles.overlay} ${styles[themeClass]}`} onClick={onClose}>
            <div className={`${styles.modal} ${styles[themeClass]}`} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        <i className={theme === ThemeType.STEAMPUNK ? "bi-gear" : "bi-qr-code"} aria-hidden="true"></i>
                        {theme === ThemeType.STEAMPUNK ? "Brass Code Plate" : "QR Code"}
                    </h3>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close QR code generator">
                        <i className="bi-x-lg" aria-hidden="true"></i>
                    </button>
                </div>

                <div className={styles.content}>{content}</div>
            </div>
        </div>
    );
}
