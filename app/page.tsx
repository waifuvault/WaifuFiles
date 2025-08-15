"use client";

import React, { ChangeEvent, DragEvent, ReactElement, useEffect, useState } from "react";
import styles from "./page.module.css";
import { FileUpload, WaifuFile } from "waifuvault-node-api";
import { Restriction, UploadItem } from "./types/upload";
import { formatFileSize } from "./utils/upload";
import DropZone from "./components/DropZone";
import UploadQueue from "./components/UploadQueue";

export default function Home(): ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [maxFileSize, setMaxFileSize] = useState<number>(1048576000); // Default 1GB
    const [bannedTypes, setBannedTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchRestrictions = async () => {
            try {
                const response = await fetch("/api/restrictions");
                const restrictions: Restriction[] = await response.json();

                for (const restriction of restrictions) {
                    if (restriction.type === "MAX_FILE_SIZE") {
                        setMaxFileSize(Number(restriction.value));
                    } else if (restriction.type === "BANNED_MIME_TYPE") {
                        setBannedTypes(String(restriction.value).split(","));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch restrictions:", error);
            }
        };

        fetchRestrictions();
    }, []);

    const addFiles = (files: FileList): void => {
        const newUploads: UploadItem[] = Array.from(files).map(file => {
            if (file.size > maxFileSize) {
                return {
                    file,
                    status: "error" as const,
                    error: `File too large (${formatFileSize(file.size)}). Max size: ${formatFileSize(maxFileSize)}`,
                    options: {},
                };
            }

            if (bannedTypes.length > 0 && bannedTypes.includes(file.type)) {
                return {
                    file,
                    status: "error" as const,
                    error: `File type not allowed: ${file.type}`,
                    options: {},
                };
            }

            return {
                file,
                status: "pending" as const,
                options: {},
            };
        });
        setUploads(prev => [...prev, ...newUploads]);
    };

    const uploadFile = async (uploadIndex: number) => {
        const upload = uploads[uploadIndex];
        if (!upload || upload.status !== "pending") {
            return;
        }

        setUploads(prev =>
            prev.map((item, index) => (index === uploadIndex ? { ...item, status: "uploading", progress: 0 } : item)),
        );

        try {
            const formData = new FormData();
            formData.append("file", upload.file);
            formData.append("options", JSON.stringify(upload.options));

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", event => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploads(prev =>
                        prev.map((item, index) =>
                            index === uploadIndex ? { ...item, progress: percentComplete } : item,
                        ),
                    );
                }
            });

            xhr.upload.addEventListener("loadend", () => {
                setUploads(prev =>
                    prev.map((item, index) =>
                        index === uploadIndex ? { ...item, status: "processing", progress: 100 } : item,
                    ),
                );
            });

            // Create a promise to handle the XMLHttpRequest - can't use fetch
            const uploadPromise = new Promise<WaifuFile>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch {
                            reject(new Error("Invalid JSON response"));
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            if (errorData.name && errorData.status) {
                                reject(new Error(`${errorData.name}: ${errorData.error}`));
                            } else {
                                reject(new Error(errorData.error ?? "Upload failed"));
                            }
                        } catch {
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    reject(new Error("Network error occurred"));
                };

                xhr.open("POST", "/api/upload");
                xhr.send(formData);
            });

            const result = await uploadPromise;

            setUploads(prev =>
                prev.map((item, index) =>
                    index === uploadIndex ? { ...item, status: "completed", result, progress: 100 } : item,
                ),
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            setUploads(prev =>
                prev.map((item, index) =>
                    index === uploadIndex ? { ...item, status: "error", error: errorMessage } : item,
                ),
            );
        }
    };

    const resetToPending = (uploadIndex: number) => {
        setUploads(prev =>
            prev.map((item, index) =>
                index === uploadIndex ? { ...item, status: "pending", error: undefined } : item,
            ),
        );
    };

    const updateUploadOptions = (uploadIndex: number, options: Partial<FileUpload>) => {
        setUploads(prev =>
            prev.map((item, index) =>
                index === uploadIndex ? { ...item, options: { ...item.options, ...options } } : item,
            ),
        );
    };

    const toggleOptions = (uploadIndex: number) => {
        setUploads(prev =>
            prev.map((item, index) => (index === uploadIndex ? { ...item, showOptions: !item.showOptions } : item)),
        );
    };

    const uploadAll = async () => {
        const pendingUploads = uploads
            .map((upload, index) => ({ upload, index }))
            .filter(({ upload }) => upload.status === "pending");

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
        const dropzoneElement = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as HTMLElement;

        if (!relatedTarget || !dropzoneElement.contains(relatedTarget)) {
            setIsDragging(false);
        }
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

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addFiles(files);
        }
    };

    const clearUploads = () => {
        setUploads([]);
    };

    const removeUpload = (index: number) => {
        setUploads(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.logo}>
                    <a href={"https://waifuvault.moe"} target="_blank" rel="noopener noreferrer">
                        <div className={styles.logoImage}></div>
                    </a>
                </div>
                <h1 className={styles.title}>WaifuVault Uploader</h1>
                <p className={styles.subtitle}>Fast file hosting</p>
            </div>

            <DropZone
                isDragging={isDragging}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                maxFileSize={maxFileSize}
            />

            <UploadQueue
                uploads={uploads}
                onUploadAll={uploadAll}
                onClearAll={clearUploads}
                onUpload={uploadFile}
                onRemove={removeUpload}
                onResetToPending={resetToPending}
                onToggleOptions={toggleOptions}
                onUpdateOptions={updateUploadOptions}
            />
        </div>
    );
}
