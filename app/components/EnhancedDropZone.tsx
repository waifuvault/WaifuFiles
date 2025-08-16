import React, { DragEvent, useRef, useState } from "react";
import styles from "../page.module.css";
import { formatFileSize } from "../utils/upload";
import FilePreview from "./FilePreview";

interface EnhancedDropZoneProps {
    isDragging: boolean;
    maxFileSize: number;
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EnhancedDropZone({
    isDragging,
    maxFileSize,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileSelect,
}: EnhancedDropZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
    const [showPreviews, setShowPreviews] = useState(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragEnter = (e: DragEvent) => {
        onDragEnter(e);

        const files = [...(e.dataTransfer.files ?? [])];
        if (files.length > 0) {
            setDraggedFiles(files);
            setShowPreviews(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        onDragLeave(e);

        const dropzoneElement = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as HTMLElement;

        if (!relatedTarget || !dropzoneElement.contains(relatedTarget)) {
            setShowPreviews(false);
            setDraggedFiles([]);
        }
    };

    const handleDrop = (e: DragEvent) => {
        onDrop(e);
        setShowPreviews(false);
        setDraggedFiles([]);
    };

    return (
        <div
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={onDragOver}
            onDrop={handleDrop}
        >
            <input multiple onChange={onFileSelect} ref={fileInputRef} style={{ display: "none" }} type="file" />

            {showPreviews && draggedFiles.length > 0 ? (
                <div className={styles.dragPreviewContainer}>
                    <h3>
                        Ready to upload {draggedFiles.length} file{draggedFiles.length > 1 ? "s" : ""}
                    </h3>
                    <div className={styles.dragPreviews}>
                        {draggedFiles.map((file, index) => (
                            <div className={styles.dragPreviewItem} key={index}>
                                <FilePreview file={file} size="small" />
                                <span className={styles.dragPreviewName}>
                                    {file.name.length > 20 ? `${file.name.slice(0, 17)}...` : file.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.dropInstruction}>Drop to add files</p>
                </div>
            ) : (
                <div className={styles.dropzoneContent}>
                    <div className={styles.uploadIcon}>
                        <i aria-hidden="true" className="bi bi-cloud-upload"></i>
                    </div>
                    <p>Drop files here or click to select</p>
                    <span className={styles.hint}>
                        Multiple files supported • Max {formatFileSize(maxFileSize)} per file
                    </span>
                    <span className={styles.permanentHint}>
                        <strong>Permanent storage - files never expire</strong>
                    </span>
                </div>
            )}
        </div>
    );
}
