"use client";

import React, { ChangeEvent, DragEvent, ReactElement, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { FileUpload } from "waifuvault-node-api";
import { Restriction, UploadItem } from "./types/upload";
import { formatFileSize, validateUploadOptions } from "./utils/upload";
import UploadQueue from "./components/UploadQueue";
import ThemeSelector from "@/app/components/ThemeSelector";
import { ChunkedUploader } from "@/app/utils/chunkedUpload";

import ParticleBackground from "@/app/components/ParticleBackground";
import AdvancedDropZone from "@/app/components/AdvancedDropZone";

import { useNotifications } from "@/app/hooks/useNotifications";
import { NotificationContainer } from "@/app/components/NotificationContainer";
import ClipboardIndicator from "@/app/components/ClipboardIndicator";
import { useClipboard } from "@/app/hooks/useClipboard";

const MAX_CONCURRENT_UPLOADS = 3;

export default function Home(): ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [maxFileSize, setMaxFileSize] = useState<number>(1_048_576_000);
    const [bannedTypes, setBannedTypes] = useState<string[]>([]);

    const [isUploading, setIsUploading] = useState(false);

    const { notifications, addNotification, removeNotification } = useNotifications();

    const previousUploadStatusesRef = useRef<Map<number, string>>(new Map());
    const uploadSessionRef = useRef(0);

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

    useEffect(() => {
        const activeUploads = uploads.some(upload => upload.status === "uploading" || upload.status === "processing");
        setIsUploading(activeUploads);
    }, [uploads]);

    useEffect(() => {
        const currentStatuses = new Map<number, string>();
        let shouldScroll = false;

        uploads.forEach((upload, index) => {
            const previousStatus = previousUploadStatusesRef.current.get(index);
            const currentStatus = upload.status;

            currentStatuses.set(index, currentStatus);

            if (
                previousStatus &&
                previousStatus !== currentStatus &&
                (currentStatus === "completed" || currentStatus === "error")
            ) {
                shouldScroll = true;
            }
        });

        previousUploadStatusesRef.current = currentStatuses;

        if (shouldScroll) {
            setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "smooth",
                });
            }, 100);
        }
    }, [uploads]);

    const handleClipboardFiles = (files: File[]) => {
        console.log("handleClipboardFiles called with:", files);
        const fileList = new DataTransfer();
        files.forEach(file => fileList.items.add(file));
        addFiles(fileList.files);

        addNotification({
            type: "success",
            title: "Files pasted from clipboard",
            message: `${files.length} file${files.length > 1 ? "s" : ""} added to upload queue`,
            duration: 3000,
        });
    };

    const handleClipboardUrl = async (url: string) => {
        console.log("handleClipboardUrl called with:", url);
        try {
            addNotification({
                type: "info",
                title: "URL detected in clipboard",
                message: "URL download feature coming soon!",
                duration: 4000,
            });

            console.log("URL from clipboard:", url);
        } catch (error) {
            console.error("Failed to handle clipboard URL:", error);
            addNotification({
                type: "error",
                title: "Failed to process URL",
                message: "Could not process the URL from clipboard",
                duration: 4000,
            });
        }
    };

    const { clipboardContent, pasteFromClipboard } = useClipboard({
        onFilesDetected: handleClipboardFiles,
        onUrlDetected: handleClipboardUrl,
        enabled: !isUploading && !isDragging,
    });

    const addFiles = (files: FileList): void => {
        const newUploads: UploadItem[] = [...files].map(file => {
            const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

            if (file.size > maxFileSize) {
                return {
                    id,
                    error: `File too large (${formatFileSize(file.size)}). Max size: ${formatFileSize(maxFileSize)}`,
                    file,
                    options: {},
                    status: "error" as const,
                };
            }

            if (bannedTypes.length > 0 && bannedTypes.includes(file.type)) {
                return {
                    id,
                    error: `File type not allowed: ${file.type}`,
                    file,
                    options: {},
                    status: "error" as const,
                };
            }

            return {
                id,
                file,
                options: {},
                status: "pending" as const,
            };
        });
        setUploads(prev => [...prev, ...newUploads]);
    };

    const uploadFile = async (uploadIdOrIndex: string | number, session?: number) => {
        const sessionId = session ?? uploadSessionRef.current;

        const getIndexById = (id: string) => uploads.findIndex(u => u.id === id);

        const id = typeof uploadIdOrIndex === "string" ? uploadIdOrIndex : uploads[uploadIdOrIndex]?.id;
        if (!id) {
            return;
        }

        const currentIndex = getIndexById(id);
        const upload = uploads[currentIndex];
        if (!upload || (upload.status !== "pending" && upload.status !== "error" && upload.status !== "queued")) {
            return;
        }

        const validation = validateUploadOptions(upload.options);
        if (!validation.isValid) {
            setUploads(prev =>
                prev.map(item =>
                    item.id === id
                        ? {
                              ...item,
                              error: `Validation failed: ${validation.errors.join(", ")}`,
                              status: "error",
                          }
                        : item,
                ),
            );

            addNotification({
                type: "error",
                title: "Upload validation failed",
                message: validation.errors.join(", "),
                duration: 5000,
            });
            return;
        }

        const controllerUploadId = ChunkedUploader.getUploadId(upload.file, {
            ...upload.options,
            filename: upload.file.name,
        });

        setUploads(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, progress: 0, status: "uploading", uploadId: controllerUploadId, error: undefined }
                    : item,
            ),
        );

        try {
            if (sessionId !== uploadSessionRef.current) {
                ChunkedUploader.cancelUpload(controllerUploadId);
                return;
            }

            const result = await ChunkedUploader.uploadFile(
                upload.file,
                { ...upload.options, filename: upload.file.name },
                (progress: number) => {
                    if (sessionId !== uploadSessionRef.current) {
                        return;
                    }
                    setUploads(prev => prev.map(item => (item.id === id ? { ...item, progress } : item)));
                },
                () => {
                    if (sessionId !== uploadSessionRef.current) {
                        return;
                    }
                    setUploads(prev =>
                        prev.map(item => (item.id === id ? { ...item, progress: 100, status: "processing" } : item)),
                    );
                },
                controllerUploadId,
            );

            if (sessionId !== uploadSessionRef.current) {
                ChunkedUploader.cancelUpload(controllerUploadId);
                return;
            }

            setUploads(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, result, status: "completed", uploadId: undefined } : item,
                ),
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            if (sessionId !== uploadSessionRef.current) {
                return;
            }
            setUploads(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, error: errorMessage, status: "error", uploadId: undefined } : item,
                ),
            );
        }
    };

    const resetToPending = (id: string) => {
        setUploads(prev =>
            prev.map(item => (item.id === id ? { ...item, error: undefined, status: "pending" } : item)),
        );
    };

    const updateUploadOptions = (id: string, options: Partial<FileUpload>) => {
        setUploads(prev =>
            prev.map(item => (item.id === id ? { ...item, options: { ...item.options, ...options } } : item)),
        );
    };

    const toggleOptions = (id: string) => {
        setUploads(prev => prev.map(item => (item.id === id ? { ...item, showOptions: !item.showOptions } : item)));
    };

    const uploadAll = async () => {
        const session = ++uploadSessionRef.current;

        const pendingUploads = uploads.filter(u => u.status === "pending");

        const invalidUploads = pendingUploads.filter(upload => {
            const validation = validateUploadOptions(upload.options);
            return !validation.isValid;
        });

        if (invalidUploads.length > 0) {
            setUploads(prev =>
                prev.map(item => {
                    const validation = validateUploadOptions(item.options);
                    if (!validation.isValid && item.status === "pending") {
                        return {
                            ...item,
                            error: `Validation failed: ${validation.errors.join(", ")}`,
                            status: "error" as const,
                        };
                    }
                    return item;
                }),
            );
            addNotification({
                type: "error",
                title: "Some uploads have validation errors",
                message: `${invalidUploads.length} file(s) have invalid options. Please fix them before uploading.`,
                duration: 7000,
            });
            const validIds = pendingUploads
                .filter(upload => validateUploadOptions(upload.options).isValid)
                .map(u => u.id);

            if (validIds.length === 0) {
                return;
            }
        }

        const pendingIds = uploads.filter(u => u.status === "pending").map(u => u.id);
        if (pendingIds.length === 0) {
            return;
        }

        const queuedIds = new Set(pendingIds.slice(MAX_CONCURRENT_UPLOADS));
        if (queuedIds.size > 0) {
            setUploads(prev =>
                prev.map(item => (queuedIds.has(item.id) ? { ...item, status: "queued" as const, progress: 0 } : item)),
            );
        }

        let nextIndex = 0;

        const worker = async () => {
            while (session === uploadSessionRef.current) {
                const current = nextIndex++;
                if (current >= pendingIds.length) {
                    return;
                }
                const id = pendingIds[current];
                try {
                    await uploadFile(id, session);
                } catch (error) {
                    console.error("Error uploading file:", error);
                }
            }
        };

        const poolSize = Math.min(MAX_CONCURRENT_UPLOADS, pendingIds.length);
        const workers = Array.from({ length: poolSize }, () => worker());

        await Promise.allSettled(workers);

        setUploads(prev =>
            prev.map(item => (item.status === "queued" ? { ...item, status: "pending" as const } : item)),
        );
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

        const { files } = e.dataTransfer;
        if (files.length > 0) {
            addFiles(files);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files && files.length > 0) {
            addFiles(files);
        }
        e.target.value = "";
    };

    const clearUploads = () => {
        uploadSessionRef.current++;

        uploads.forEach(upload => {
            if (upload.uploadId && (upload.status === "uploading" || upload.status === "processing")) {
                ChunkedUploader.cancelUpload(upload.uploadId);
            }
        });

        setUploads([]);
    };

    const removeUpload = (id: string) => {
        const upload = uploads.find(u => u.id === id);

        if (upload && upload.uploadId && (upload.status === "uploading" || upload.status === "processing")) {
            ChunkedUploader.cancelUpload(upload.uploadId);
        }

        setUploads(prev => prev.filter(item => item.id !== id));
    };

    return (
        <div className={styles.container}>
            <ParticleBackground isDragging={isDragging} isUploading={isUploading} intensity="medium" />

            <NotificationContainer notifications={notifications} onRemove={removeNotification} />

            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.headerTopContent}>
                        <ThemeSelector />
                    </div>
                </div>

                <div className={styles.logo}>
                    <a
                        href={"https://waifuvault.moe"}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Visit Waifuvault main site"
                    >
                        <div className={styles.logoImage}></div>
                    </a>
                </div>
                <h1 className={styles.title}>WaifuVault Uploader</h1>
                <p className={styles.subtitle}>Fast File Hosting</p>
            </div>

            <AdvancedDropZone
                isDragging={isDragging}
                maxFileSize={maxFileSize}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
            />
            {!isDragging && !isUploading && (
                <ClipboardIndicator clipboardContent={clipboardContent} onPaste={pasteFromClipboard} />
            )}

            <UploadQueue
                onClearAll={clearUploads}
                onRemove={removeUpload}
                onResetToPending={resetToPending}
                onToggleOptions={toggleOptions}
                onUpdateOptions={updateUploadOptions}
                onUpload={uploadFile}
                onUploadAll={uploadAll}
                uploads={uploads}
            />
        </div>
    );
}
