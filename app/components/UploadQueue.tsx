import React from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import UploadItem from "./UploadItem";
import { UploadItem as UploadItemType } from "../types/upload";

interface UploadQueueProps {
    onClearAll: () => void;
    onRemove: (index: number) => void;
    onResetToPending: (index: number) => void;
    onToggleOptions: (index: number) => void;
    onUpdateOptions: (index: number, options: Partial<FileUpload>) => void;
    onUpload: (index: number) => void;
    onUploadAll: () => void;
    uploads: UploadItemType[];
}

export default function UploadQueue({
    onClearAll,
    onRemove,
    onResetToPending,
    onToggleOptions,
    onUpdateOptions,
    onUpload,
    onUploadAll,
    uploads,
}: UploadQueueProps) {
    const pendingCount = uploads.filter(u => u.status === "pending").length;
    const completedCount = uploads.filter(u => u.status === "completed").length;

    if (uploads.length === 0) {
        return null;
    }

    return (
        <div className={styles.uploadSection}>
            <div className={styles.uploadHeader}>
                <h3>Upload Queue ({uploads.length} files)</h3>
                <div className={styles.uploadActions}>
                    {pendingCount > 0 && (
                        <button className={styles.uploadAllBtn} onClick={onUploadAll}>
                            Upload All ({pendingCount})
                        </button>
                    )}
                    <button className={styles.clearBtn} onClick={onClearAll}>
                        Clear All
                    </button>
                </div>
            </div>

            <div className={styles.uploadList}>
                {uploads.map((upload, index) => (
                    <UploadItem
                        index={index}
                        key={index}
                        onRemove={onRemove}
                        onResetToPending={onResetToPending}
                        onToggleOptions={onToggleOptions}
                        onUpdateOptions={onUpdateOptions}
                        onUpload={onUpload}
                        upload={upload}
                    />
                ))}
            </div>

            {completedCount > 0 && (
                <div className={styles.summary}>
                    <p>{completedCount} files uploaded successfully!</p>
                </div>
            )}
        </div>
    );
}
