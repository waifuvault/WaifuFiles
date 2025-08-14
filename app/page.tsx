"use client"

import React, {DragEvent, useEffect, useRef, useState} from 'react';
import styles from './page.module.css';
import {WaifuFile} from "waifuvault-node-api";

interface UploadItem {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    result?: WaifuFile;
    error?: string;
    progress?: number;
}

interface Restriction {
    type: string;
    value: string | number;
}

export default function Home() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [maxFileSize, setMaxFileSize] = useState<number>(1048576000); // Default 1GB
    const [bannedTypes, setBannedTypes] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchRestrictions = async () => {
            try {
                const response = await fetch('/api/restrictions');
                const restrictions: Restriction[] = await response.json();

                for (const restriction of restrictions) {
                    if (restriction.type === 'MAX_FILE_SIZE') {
                        setMaxFileSize(Number(restriction.value));
                    } else if (restriction.type === 'BANNED_MIME_TYPE') {
                        setBannedTypes(String(restriction.value).split(','));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch restrictions:', error);
            }
        };

        fetchRestrictions();
    }, []);

    const addFiles = (files: FileList) => {
        const newUploads: UploadItem[] = Array.from(files).map(file => {
            if (file.size > maxFileSize) {
                return {
                    file,
                    status: 'error' as const,
                    error: `File too large (${formatFileSize(file.size)}). Max size: ${formatFileSize(maxFileSize)}`
                };
            }

            if (bannedTypes.length > 0 && bannedTypes.includes(file.type)) {
                return {
                    file,
                    status: 'error' as const,
                    error: `File type not allowed: ${file.type}`
                };
            }

            return {
                file,
                status: 'pending' as const
            };
        });
        setUploads(prev => [...prev, ...newUploads]);
    };

    const uploadFile = async (uploadIndex: number) => {
        const upload = uploads[uploadIndex];
        if (!upload || upload.status !== 'pending') return;

        setUploads(prev => prev.map((item, index) =>
            index === uploadIndex ? { ...item, status: 'uploading', progress: 0 } : item
        ));

        try {
            const formData = new FormData();
            formData.append('file', upload.file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();

                if (errorData.name && errorData.status) {
                    throw new Error(`${errorData.name}: ${errorData.error}`);
                }

                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();

            setUploads(prev => prev.map((item, index) =>
                index === uploadIndex ? { ...item, status: 'completed', result, progress: 100 } : item
            ));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setUploads(prev => prev.map((item, index) =>
                index === uploadIndex ? { ...item, status: 'error', error: errorMessage } : item
            ));
        }
    };

    const uploadAll = async () => {
        const pendingUploads = uploads
            .map((upload, index) => ({ upload, index }))
            .filter(({ upload }) => upload.status === 'pending');

        for (const { index } of pendingUploads) {
            await uploadFile(index);
        }
    };

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            addFiles(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addFiles(files);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const clearUploads = () => {
        setUploads([]);
    };

    const removeUpload = (index: number) => {
        setUploads(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const pendingCount = uploads.filter(u => u.status === 'pending').length;
    const completedCount = uploads.filter(u => u.status === 'completed').length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.logo}>
                    <a href={'https://waifuvault.moe'} target="_blank" rel="noopener noreferrer">
                        <div className={styles.logoImage}></div>
                    </a>
                </div>
                <h1 className={styles.title}>WaifuVault Uploader</h1>
                <p className={styles.subtitle}>Fast, temporary file hosting</p>
            </div>

            <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: 'none' }}
                />

                <div className={styles.dropzoneContent}>
                    <div className={styles.uploadIcon}>📁</div>
                    <p>Drop files here or click to select</p>
                    <span className={styles.hint}>Multiple files supported • Max {formatFileSize(maxFileSize)} per file</span>
                </div>
            </div>

            {uploads.length > 0 && (
                <div className={styles.uploadSection}>
                    <div className={styles.uploadHeader}>
                        <h3>Upload Queue ({uploads.length} files)</h3>
                        <div className={styles.uploadActions}>
                            {pendingCount > 0 && (
                                <button onClick={uploadAll} className={styles.uploadAllBtn}>
                                    Upload All ({pendingCount})
                                </button>
                            )}
                            <button onClick={clearUploads} className={styles.clearBtn}>
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className={styles.uploadList}>
                        {uploads.map((upload, index) => (
                            <div key={index} className={`${styles.uploadItem} ${styles[upload.status]}`}>
                                <div className={styles.fileInfo}>
                                    <span className={styles.fileName}>{upload.file.name}</span>
                                    <span className={styles.fileSize}>{formatFileSize(upload.file.size)}</span>
                                </div>

                                <div className={styles.uploadStatus}>
                                    {upload.status === 'pending' && (
                                        <button
                                            onClick={() => uploadFile(index)}
                                            className={styles.uploadBtn}
                                        >
                                            Upload
                                        </button>
                                    )}

                                    {upload.status === 'uploading' && (
                                        <div className={styles.uploading}>
                                            <div className={styles.spinner}></div>
                                            <span>Uploading...</span>
                                        </div>
                                    )}

                                    {upload.status === 'completed' && upload.result && (
                                        <div className={styles.completed}>
                                            <input
                                                type="text"
                                                value={upload.result.url}
                                                readOnly
                                                className={styles.urlInput}
                                            />
                                            <button
                                                onClick={() => copyToClipboard(upload.result!.url)}
                                                className={styles.copyBtn}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    )}

                                    {upload.status === 'error' && (
                                        <div className={styles.error}>
                                            <span title={upload.error}>
                                                {upload.error && upload.error.length > 50
                                                    ? `${upload.error.substring(0, 50)}...`
                                                    : upload.error || 'Failed'
                                                }
                                            </span>
                                            <button
                                                onClick={() => uploadFile(index)}
                                                className={styles.retryBtn}
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => removeUpload(index)}
                                    className={styles.removeBtn}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {completedCount > 0 && (
                        <div className={styles.summary}>
                            <p>✨ {completedCount} files uploaded successfully!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}