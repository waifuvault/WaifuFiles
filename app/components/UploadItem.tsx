import React from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import { copyToClipboard, formatFileSize } from "../utils/upload";
import OptionsPanel from "./OptionsPanel";
import { UploadItem as UploadItemType } from "../types/upload";

interface UploadItemProps {
    upload: UploadItemType;
    index: number;
    onUpload: (index: number) => void;
    onRemove: (index: number) => void;
    onResetToPending: (index: number) => void;
    onToggleOptions: (index: number) => void;
    onUpdateOptions: (index: number, options: Partial<FileUpload>) => void;
}

export default function UploadItem({
    upload,
    index,
    onUpload,
    onRemove,
    onResetToPending,
    onToggleOptions,
    onUpdateOptions,
}: UploadItemProps) {
    const handleCopy = () => {
        if (upload.result?.url) {
            copyToClipboard(upload.result.url);
        }
    };

    const handleOptionsChange = (options: Partial<FileUpload>) => {
        onUpdateOptions(index, options);
    };

    return (
        <div className={`${styles.uploadItem} ${styles[upload.status]}`}>
            <div className={styles.uploadItemHeader}>
                <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{upload.file.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(upload.file.size)}</span>
                </div>

                <div className={styles.uploadStatus}>
                    {upload.status === "pending" && (
                        <>
                            <button
                                onClick={() => onToggleOptions(index)}
                                className={styles.optionsBtn}
                                title="Upload Options"
                            >
                                ⚙️
                            </button>
                            <button onClick={() => onUpload(index)} className={styles.uploadBtn}>
                                Upload
                            </button>
                        </>
                    )}

                    {upload.status === "uploading" && (
                        <div className={styles.uploading}>
                            <div className={styles.spinner}></div>
                            <span>Uploading...</span>
                        </div>
                    )}

                    {upload.status === "completed" && upload.result && (
                        <div className={styles.completed}>
                            <input type="text" value={upload.result.url} readOnly className={styles.urlInput} />
                            <button onClick={handleCopy} className={styles.copyBtn}>
                                Copy
                            </button>
                        </div>
                    )}

                    {upload.status === "error" && (
                        <div className={styles.error}>
                            <span title={upload.error}>
                                {upload.error && upload.error.length > 50
                                    ? `${upload.error.substring(0, 50)}...`
                                    : (upload.error ?? "Failed")}
                            </span>
                            <div className={styles.errorActions}>
                                <button onClick={() => onUpload(index)} className={styles.retryBtn}>
                                    Retry
                                </button>
                                <button onClick={() => onResetToPending(index)} className={styles.backToOptionsBtn}>
                                    Back to Options
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => onRemove(index)} className={styles.removeBtn}>
                    ✕
                </button>
            </div>

            {upload.showOptions && upload.status === "pending" && (
                <OptionsPanel options={upload.options} onOptionsChange={handleOptionsChange} />
            )}
        </div>
    );
}
