import React, { DragEvent, useRef } from "react";
import styles from "../page.module.css";
import { formatFileSize } from "../utils/upload";

interface DropZoneProps {
    isDragging: boolean;
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    maxFileSize: number;
}

export default function DropZone({
    isDragging,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileSelect,
    maxFileSize,
}: DropZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={handleClick}
        >
            <input ref={fileInputRef} type="file" onChange={onFileSelect} multiple style={{ display: "none" }} />

            <div className={styles.dropzoneContent}>
                <div className={styles.uploadIcon}>📁</div>
                <p>Drop files here or click to select</p>
                <span className={styles.hint}>
                    Multiple files supported • Max {formatFileSize(maxFileSize)} per file
                </span>
                <span className={styles.permanentHint}>
                    <strong>Permanent storage - files never expire</strong>
                </span>
            </div>
        </div>
    );
}
