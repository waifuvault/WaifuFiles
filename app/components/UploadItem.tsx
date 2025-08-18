import React, { useEffect, useState } from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import { copyToClipboard, formatFileSize } from "../utils/upload";
import OptionsPanel from "./OptionsPanel";
import Enhanced3DFilePreview from "./Enhanced3DFilePreview";
import { UploadItem as UploadItemType } from "../types/upload";
import { useTheme } from "@/app/contexts/ThemeContext";

interface UploadItemProps {
    index: number;
    onRemove: (index: number) => void;
    onResetToPending: (index: number) => void;
    onToggleOptions: (index: number) => void;
    onUpdateOptions: (index: number, options: Partial<FileUpload>) => void;
    onUpload: (index: number) => void;
    upload: UploadItemType;
}

export default function UploadItem({
    index,
    onRemove,
    onResetToPending,
    onToggleOptions,
    onUpdateOptions,
    onUpload,
    upload,
}: UploadItemProps) {
    const [copied, setCopied] = useState(false);
    const { currentTheme } = useTheme();

    const handleCopy = async () => {
        if (upload.result?.url) {
            await copyToClipboard(upload.result.url);
            setCopied(true);
        }
    };

    useEffect(() => {
        if (!copied) {
            return;
        }
        const timer = setTimeout(() => {
            setCopied(false);
        }, 5000);
        return () => {
            clearTimeout(timer);
        };
    }, [copied]);

    const handleOptionsChange = (options: Partial<FileUpload>) => {
        onUpdateOptions(index, options);
    };

    return (
        <div className={`${styles.uploadItem} ${styles[upload.status]}`}>
            <div className={styles.uploadItemHeader}>
                <Enhanced3DFilePreview
                    file={upload.file}
                    size="medium"
                    interactive={true}
                    showMetadata={upload.status === "completed"}
                    theme={currentTheme}
                />

                <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{upload.file.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(upload.file.size)}</span>
                </div>

                <div className={styles.uploadStatus}>
                    {upload.status === "pending" && (
                        <>
                            <button
                                aria-label="Upload Options"
                                className={styles.optionsBtn}
                                onClick={() => {
                                    onToggleOptions(index);
                                }}
                                title="Upload Options"
                            >
                                <i aria-hidden="true" className="bi bi-gear"></i>
                            </button>
                            <button
                                className={styles.uploadBtn}
                                onClick={() => {
                                    onUpload(index);
                                }}
                            >
                                Upload
                            </button>
                        </>
                    )}

                    {(upload.status === "uploading" || upload.status === "processing") && (
                        <div className={styles.uploading}>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${upload.progress ?? 0}%` }}
                                    ></div>
                                </div>
                                <span className={styles.progressText}>
                                    {upload.status === "processing" ? "Processing..." : `${upload.progress ?? 0}%`}
                                </span>
                            </div>
                        </div>
                    )}

                    {upload.status === "completed" && upload.result && (
                        <div className={styles.completed}>
                            <input className={styles.urlInput} readOnly type="text" value={upload.result.url} />
                            <button className={styles.copyBtn} onClick={handleCopy}>
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    )}

                    {upload.status === "error" && (
                        <div className={styles.error}>
                            <span title={upload.error}>
                                {upload.error && upload.error.length > 50
                                    ? `${upload.error.slice(0, 50)}...`
                                    : (upload.error ?? "Failed")}
                            </span>
                            <div className={styles.errorActions}>
                                <button
                                    className={styles.retryBtn}
                                    onClick={() => {
                                        onUpload(index);
                                    }}
                                >
                                    Retry
                                </button>
                                <button
                                    className={styles.backToOptionsBtn}
                                    onClick={() => {
                                        onResetToPending(index);
                                    }}
                                >
                                    Back to Options
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    aria-label={
                        upload.status === "uploading" || upload.status === "processing" ? "Cancel Upload" : "Remove"
                    }
                    className={styles.removeBtn}
                    onClick={() => {
                        onRemove(index);
                    }}
                    title={
                        upload.status === "uploading" || upload.status === "processing"
                            ? "Cancel upload"
                            : "Remove file"
                    }
                >
                    <i aria-hidden="true" className="bi bi-x-lg"></i>
                </button>
            </div>

            {upload.showOptions && upload.status === "pending" && (
                <OptionsPanel onOptionsChange={handleOptionsChange} options={upload.options} />
            )}
        </div>
    );
}
