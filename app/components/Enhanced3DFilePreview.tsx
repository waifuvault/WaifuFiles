import React, { useEffect, useRef, useState } from "react";
import styles from "./Enhanced3DFilePreview.module.css";
import { FilePreview as FilePreviewType, generateFilePreview, getFileIcon } from "../utils/filePreview";
import { AudioPreview } from "@/app/components/AudioPreview";
import { ThemeType } from "@/app/constants/theme";

interface Enhanced3DFilePreviewProps {
    file: File;
    size?: "large" | "medium" | "small";
    interactive?: boolean;
    showMetadata?: boolean;
    theme?: ThemeType;
}

interface FileMetadata {
    dimensions?: string;
    duration?: string;
    pages?: number;
    words?: number;
    encoding?: string;
}

export default function Enhanced3DFilePreview({
    file,
    size = "medium",
    interactive = true,
    showMetadata = false,
    theme = ThemeType.DEFAULT,
}: Enhanced3DFilePreviewProps) {
    const [preview, setPreview] = useState<FilePreviewType | null>(null);
    const [metadata, setMetadata] = useState<FileMetadata>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(null);

    useEffect(() => {
        let mounted = true;
        let urlToRevoke: string | null = null;

        const loadPreview = async () => {
            try {
                const previewData = await generateFilePreview(file);
                if (mounted) {
                    setPreview(previewData);
                    setIsLoading(false);
                    if (previewData.url?.startsWith("blob:")) {
                        urlToRevoke = previewData.url;
                    }
                }

                if (file.type.startsWith("image/")) {
                    const img = new Image();
                    img.onload = () => {
                        if (mounted) {
                            setMetadata(prev => ({
                                ...prev,
                                dimensions: `${img.width}×${img.height}`,
                            }));
                        }
                    };
                    if (previewData.url) {
                        img.src = previewData.url;
                    }
                }

                if (file.type.startsWith("video/")) {
                    const video = document.createElement("video");
                    video.preload = "metadata";
                    video.muted = true;
                    video.crossOrigin = "anonymous";

                    const handleMetadataLoaded = () => {
                        if (mounted && video.duration && !isNaN(video.duration)) {
                            setMetadata(prev => ({
                                ...prev,
                                dimensions: `${video.videoWidth}×${video.videoHeight}`,
                                duration: formatDuration(video.duration),
                            }));
                        }
                        video.removeEventListener("loadedmetadata", handleMetadataLoaded);
                        video.removeEventListener("error", handleError);
                        video.remove();
                    };

                    const handleError = (e: Event) => {
                        console.log("Failed to load video metadata:", e);
                        video.removeEventListener("loadedmetadata", handleMetadataLoaded);
                        video.removeEventListener("error", handleError);
                        video.remove();
                    };

                    video.addEventListener("loadedmetadata", handleMetadataLoaded);
                    video.addEventListener("error", handleError);

                    const videoUrl = URL.createObjectURL(file);
                    video.src = videoUrl;

                    video.style.display = "none";
                    document.body.appendChild(video);

                    video.load();

                    const cleanup = () => {
                        URL.revokeObjectURL(videoUrl);
                        if (video.parentNode) {
                            video.parentNode.removeChild(video);
                        }
                    };

                    setTimeout(cleanup, 10000);
                }

                if (file.type.startsWith("audio/")) {
                    const audio = new Audio();
                    audio.onloadedmetadata = () => {
                        if (mounted) {
                            setMetadata(prev => ({
                                ...prev,
                                duration: formatDuration(audio.duration),
                            }));
                        }
                    };
                    if (previewData.url) {
                        audio.src = previewData.url;
                    }
                }
            } catch {
                if (mounted) {
                    setPreview({
                        error: "Failed to generate preview",
                        type: "unknown",
                    });
                    setIsLoading(false);
                }
            }
        };

        loadPreview();

        return () => {
            mounted = false;
            if (urlToRevoke) {
                URL.revokeObjectURL(urlToRevoke);
            }
        };
    }, [file]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interactive || !containerRef.current) {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const baseRotationX = -5;
        const baseRotationY = 5;

        const rotateY = baseRotationY + (e.clientX - centerX) / 6;
        const rotateX = baseRotationX - (e.clientY - centerY) / 6;

        containerRef.current.style.transition = "none";

        containerRef.current.style.setProperty("--rotate-x", `${rotateX}deg`);
        containerRef.current.style.setProperty("--rotate-y", `${rotateY}deg`);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (containerRef.current) {
            containerRef.current.style.transition = "";
            containerRef.current.style.setProperty("--rotate-x", "-5deg");
            containerRef.current.style.setProperty("--rotate-y", "5deg");
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (containerRef.current) {
            containerRef.current.style.transition = "none";
        }
    };

    const sizeClass = `filePreview${size.charAt(0).toUpperCase() + size.slice(1)}`;
    const themeClass = theme ? `theme${theme.charAt(0).toUpperCase() + theme.slice(1)}` : "";

    if (isLoading) {
        return (
            <div className={`${styles.filePreview} ${styles[sizeClass]} ${styles.loading} ${styles[themeClass]}`}>
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Processing...</div>
                </div>
            </div>
        );
    }

    if (!preview || preview.error) {
        return (
            <div className={`${styles.filePreview} ${styles[sizeClass]} ${styles.error} ${styles[themeClass]}`}>
                <div className={styles.errorContent}>
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                    </span>
                    {preview?.error && size !== "small" && <span className={styles.errorText}>{preview.error}</span>}
                </div>
            </div>
        );
    }

    const renderPreviewContent = () => {
        switch (preview.type) {
            case "audio":
                return <AudioPreview theme={theme} />;

            case "image":
                return preview.url ? (
                    <div className={styles.imageContainer}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            alt={file.name}
                            className={styles.previewImage}
                            onError={() => {
                                setPreview({ ...preview, error: "Failed to load image" });
                            }}
                            src={preview.url}
                        />
                        <div className={styles.imageOverlay}>
                            <div className={styles.imageInfo}>
                                {metadata.dimensions && (
                                    <span className={styles.metadataTag}>{metadata.dimensions}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                    </span>
                );

            case "video":
                return (
                    <div className={styles.videoContainer}>
                        {preview.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={`${file.name} thumbnail`} className={styles.previewImage} src={preview.url} />
                        )}
                        <div className={styles.playOverlay}>
                            <div className={styles.playButton}>
                                <i aria-hidden="true" className="bi bi-film"></i>
                            </div>
                        </div>
                        {metadata.duration && <div className={styles.durationBadge}>{metadata.duration}</div>}
                    </div>
                );

            case "pdf":
                return (
                    <div className={styles.pdfContainer}>
                        <div className={styles.documentStack}>
                            <div className={styles.documentPage}></div>
                            <div className={styles.documentPage}></div>
                            <div className={styles.documentPage}>
                                <i aria-hidden="true" className="bi bi-filetype-pdf"></i>
                            </div>
                        </div>
                        {size !== "small" && <span className={styles.fileType}>PDF</span>}
                    </div>
                );

            case "text":
                return size === "small" ? (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className="bi bi-file-text"></i>
                    </span>
                ) : (
                    <div className={styles.textContainer}>
                        <div className={styles.codeEditor}>
                            <div className={styles.editorHeader}>
                                <div className={styles.editorButtons}>
                                    <span className={styles.editorButton}></span>
                                    <span className={styles.editorButton}></span>
                                    <span className={styles.editorButton}></span>
                                </div>
                            </div>
                            <div className={styles.editorContent}>
                                {preview.content && <div className={styles.textContent}>{preview.content}</div>}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                    </span>
                );
        }
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.filePreview} ${styles[sizeClass]} ${styles[preview.type]} ${styles[themeClass]} ${isHovered ? styles.hovered : ""}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={
                {
                    transform: `perspective(1000px) rotateX(var(--rotate-x, -5deg)) rotateY(var(--rotate-y, 5deg))`,
                    "--rotate-x": "-5deg",
                    "--rotate-y": "5deg",
                } as React.CSSProperties
            }
        >
            <div className={styles.previewInner}>
                {renderPreviewContent()}

                {showMetadata && Object.keys(metadata).length > 0 && (
                    <div className={styles.metadataPanel}>
                        {metadata.dimensions && (
                            <div className={styles.metadataItem}>
                                <i className="bi bi-aspect-ratio"></i>
                                {metadata.dimensions}
                            </div>
                        )}
                        {metadata.duration && (
                            <div className={styles.metadataItem}>
                                <i className="bi bi-clock"></i>
                                {metadata.duration}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {size !== "small" && (
                <div className={styles.previewOverlay}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            )}
        </div>
    );
}
