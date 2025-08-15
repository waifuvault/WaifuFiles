import React from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import UploadItem from "./UploadItem";
import { UploadItem as UploadItemType } from "../types/upload";

interface UploadQueueProps {
    uploads: UploadItemType[];
    onUploadAll: () => void;
    onClearAll: () => void;
    onUpload: (index: number) => void;
    onRemove: (index: number) => void;
    onResetToPending: (index: number) => void;
    onToggleOptions: (index: number) => void;
    onUpdateOptions: (index: number, options: Partial<FileUpload>) => void;
}

export default function UploadQueue({
    uploads,
    onUploadAll,
    onClearAll,
    onUpload,
    onRemove,
    onResetToPending,
    onToggleOptions,
    onUpdateOptions,
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
                        <button onClick={onUploadAll} className={styles.uploadAllBtn}>
                            Upload All ({pendingCount})
                        </button>
                    )}
                    <button onClick={onClearAll} className={styles.clearBtn}>
                        Clear All
                    </button>
                </div>
            </div>

            <div className={styles.uploadList}>
                {uploads.map((upload, index) => (
                    <UploadItem
                        key={index}
                        upload={upload}
                        index={index}
                        onUpload={onUpload}
                        onRemove={onRemove}
                        onResetToPending={onResetToPending}
                        onToggleOptions={onToggleOptions}
                        onUpdateOptions={onUpdateOptions}
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
