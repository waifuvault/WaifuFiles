import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { FilePreview as FilePreviewType, generateFilePreview, getFileIcon } from "../utils/filePreview";

interface FilePreviewProps {
    file: File;
    size?: "small" | "medium" | "large";
}

export default function FilePreview({ file, size = "medium" }: FilePreviewProps) {
    const [preview, setPreview] = useState<FilePreviewType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let urlToRevoke: string | null = null;

        const loadPreview = async () => {
            try {
                const previewData = await generateFilePreview(file);
                if (mounted) {
                    setPreview(previewData);
                    setIsLoading(false);
                    if (previewData.url && previewData.url.startsWith("blob:")) {
                        urlToRevoke = previewData.url;
                    }
                }
            } catch {
                if (mounted) {
                    setPreview({
                        type: "unknown",
                        error: "Failed to generate preview",
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

    const sizeClass = `filePreview${size.charAt(0).toUpperCase() + size.slice(1)}`;

    if (isLoading) {
        return (
            <div className={`${styles.filePreview} ${styles[sizeClass]} ${styles.loading}`}>
                <div className={styles.previewSpinner}></div>
            </div>
        );
    }

    if (!preview || preview.error) {
        return (
            <div className={`${styles.filePreview} ${styles[sizeClass]} ${styles.error}`}>
                <span className={styles.fileIcon}>
                    <i className={`bi ${getFileIcon(file)}`} aria-hidden="true"></i>
                </span>
                {preview?.error && size !== "small" && <span className={styles.errorText}>{preview.error}</span>}
            </div>
        );
    }

    const renderPreviewContent = () => {
        switch (preview.type) {
            case "image":
                return preview.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={preview.url}
                        alt={file.name}
                        className={styles.previewImage}
                        onError={() => setPreview({ ...preview, error: "Failed to load image" })}
                    />
                ) : (
                    <span className={styles.fileIcon}>
                        <i className={`bi ${getFileIcon(file)}`} aria-hidden="true"></i>
                    </span>
                );

            case "video":
                return preview.url ? (
                    <div className={styles.videoPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview.url} alt={`${file.name} thumbnail`} className={styles.previewImage} />
                        <div className={styles.playOverlay}>
                            <i className="bi bi-play-fill" aria-hidden="true"></i>
                        </div>
                    </div>
                ) : (
                    <span className={styles.fileIcon}>
                        <i className="bi bi-file-earmark-play" aria-hidden="true"></i>
                    </span>
                );

            case "audio":
                return (
                    <div className={styles.audioPreview}>
                        <span className={styles.fileIcon}>
                            <i className="bi bi-music-note-beamed" aria-hidden="true"></i>
                        </span>
                        {size !== "small" && (
                            <div className={styles.audioWaves}>
                                <div className={styles.audioWave}></div>
                                <div className={styles.audioWave}></div>
                                <div className={styles.audioWave}></div>
                                <div className={styles.audioWave}></div>
                            </div>
                        )}
                    </div>
                );

            case "text":
                return size === "small" ? (
                    <span className={styles.fileIcon}>
                        <i className="bi bi-file-text" aria-hidden="true"></i>
                    </span>
                ) : (
                    <div className={styles.textPreview}>
                        <span className={styles.fileIcon}>
                            <i className="bi bi-file-text" aria-hidden="true"></i>
                        </span>
                        {preview.content && <div className={styles.textContent}>{preview.content}</div>}
                    </div>
                );

            case "pdf":
                return (
                    <div className={styles.pdfPreview}>
                        <span className={styles.fileIcon}>
                            <i className="bi bi-filetype-pdf" aria-hidden="true"></i>
                        </span>
                        {size !== "small" && <span className={styles.fileType}>PDF</span>}
                    </div>
                );

            default:
                return (
                    <span className={styles.fileIcon}>
                        <i className={`bi ${getFileIcon(file)}`} aria-hidden="true"></i>
                    </span>
                );
        }
    };

    return (
        <div className={`${styles.filePreview} ${styles[sizeClass]} ${styles[preview.type]}`}>
            {renderPreviewContent()}
            {size !== "small" && (
                <div className={styles.previewOverlay}>
                    <span className={styles.fileName}>{file.name}</span>
                </div>
            )}
        </div>
    );
}
