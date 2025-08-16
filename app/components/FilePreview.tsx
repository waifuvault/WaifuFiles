import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { FilePreview as FilePreviewType, generateFilePreview, getFileIcon } from "../utils/filePreview";

interface FilePreviewProps {
    file: File;
    size?: "large" | "medium" | "small";
}

export default function FilePreview({ file, size = "medium" }: FilePreviewProps) {
    const [preview, setPreview] = useState<FilePreviewType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let urlToRevoke: null | string = null;

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
                    <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                </span>
                {preview?.error && size !== "small" && <span className={styles.errorText}>{preview.error}</span>}
            </div>
        );
    }

    const renderPreviewContent = () => {
        switch (preview.type) {
            case "audio": {
                return (
                    <div className={styles.audioPreview}>
                        <span className={styles.fileIcon}>
                            <i aria-hidden="true" className="bi bi-music-note-beamed"></i>
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
            }

            case "image": {
                return preview.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        alt={file.name}
                        className={styles.previewImage}
                        onError={() => {
                            setPreview({ ...preview, error: "Failed to load image" });
                        }}
                        src={preview.url}
                    />
                ) : (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                    </span>
                );
            }

            case "pdf": {
                return (
                    <div className={styles.pdfPreview}>
                        <span className={styles.fileIcon}>
                            <i aria-hidden="true" className="bi bi-filetype-pdf"></i>
                        </span>
                        {size !== "small" && <span className={styles.fileType}>PDF</span>}
                    </div>
                );
            }

            case "text": {
                return size === "small" ? (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className="bi bi-file-text"></i>
                    </span>
                ) : (
                    <div className={styles.textPreview}>
                        <span className={styles.fileIcon}>
                            <i aria-hidden="true" className="bi bi-file-text"></i>
                        </span>
                        {preview.content && <div className={styles.textContent}>{preview.content}</div>}
                    </div>
                );
            }

            case "video": {
                return preview.url ? (
                    <div className={styles.videoPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={`${file.name} thumbnail`} className={styles.previewImage} src={preview.url} />
                        <div className={styles.playOverlay}>
                            <i aria-hidden="true" className="bi bi-play-fill"></i>
                        </div>
                    </div>
                ) : (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className="bi bi-file-earmark-play"></i>
                    </span>
                );
            }

            default: {
                return (
                    <span className={styles.fileIcon}>
                        <i aria-hidden="true" className={`bi ${getFileIcon(file)}`}></i>
                    </span>
                );
            }
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
