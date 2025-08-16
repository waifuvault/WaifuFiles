export interface FilePreview {
    content?: string;
    error?: string;
    type: "audio" | "image" | "pdf" | "text" | "unknown" | "video";
    url?: string;
}

export const getFileType = (file: File): FilePreview["type"] => {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith("image/")) {
        return "image";
    }
    if (mimeType.startsWith("video/")) {
        return "video";
    }
    if (mimeType.startsWith("audio/")) {
        return "audio";
    }
    if (mimeType === "application/pdf") {
        return "pdf";
    }
    if (
        mimeType.startsWith("text/") ||
        mimeType === "application/json" ||
        mimeType === "application/javascript" ||
        /\.(txt|md|js|ts|jsx|tsx|css|html|xml|yml|yaml|json|csv)$/i.test(file.name)
    ) {
        return "text";
    }

    return "unknown";
};

export const generateImagePreview = (file: File): Promise<FilePreview> => {
    return new Promise(resolve => {
        const maxSizeBytes = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSizeBytes) {
            resolve({
                type: "image",
            });
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", e => {
            resolve({
                type: "image",
                url: e.target?.result as string,
            });
        });
        reader.onerror = () => {
            resolve({
                error: "Failed to load image",
                type: "image",
            });
        };
        reader.readAsDataURL(file);
    });
};

export const generateVideoPreview = (file: File): Promise<FilePreview> => {
    return new Promise(resolve => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        video.preload = "metadata";
        video.muted = true;

        video.addEventListener("loadedmetadata", () => {
            video.currentTime = video.duration * 0.1;
        });

        video.addEventListener("seeked", () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);

                resolve({
                    type: "video",
                    url: thumbnailUrl,
                });
            } else {
                resolve({
                    error: "Failed to generate thumbnail",
                    type: "video",
                });
            }

            URL.revokeObjectURL(video.src);
        });

        video.onerror = () => {
            resolve({
                error: "Failed to load video",
                type: "video",
            });
            URL.revokeObjectURL(video.src);
        };

        video.src = URL.createObjectURL(file);
    });
};

export const generateTextPreview = (file: File): Promise<FilePreview> => {
    return new Promise(resolve => {
        if (file.size > 1024 * 100) {
            resolve({
                content: "File too large for preview",
                type: "text",
            });
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", e => {
            const content = e.target?.result as string;
            const preview = content.length > 500 ? `${content.slice(0, 500)}...` : content;

            resolve({
                content: preview,
                type: "text",
            });
        });
        reader.onerror = () => {
            resolve({
                error: "Failed to read file",
                type: "text",
            });
        };
        reader.readAsText(file);
    });
};

export const generateFilePreview = async (file: File): Promise<FilePreview> => {
    const fileType = getFileType(file);

    try {
        switch (fileType) {
            case "audio": {
                return {
                    type: "audio",
                    url: URL.createObjectURL(file),
                };
            }
            case "image": {
                return await generateImagePreview(file);
            }
            case "pdf": {
                return {
                    type: "pdf",
                    url: URL.createObjectURL(file),
                };
            }
            case "text": {
                return await generateTextPreview(file);
            }
            case "video": {
                return await generateVideoPreview(file);
            }
            default: {
                return {
                    type: "unknown",
                };
            }
        }
    } catch {
        return {
            error: "Failed to generate preview",
            type: fileType,
        };
    }
};

export const getFileIcon = (file: File): string => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith("image/")) {
        return "bi-file-image";
    }
    if (mimeType.startsWith("video/")) {
        return "bi-file-earmark-play";
    }
    if (mimeType.startsWith("audio/")) {
        return "bi-file-music";
    }
    if (mimeType.startsWith("text/")) {
        return "bi-file-text";
    }

    if (mimeType === "application/pdf") {
        return extension === "pdf" ? "bi-filetype-pdf" : "bi-file-earmark-pdf";
    }

    // Archive types
    if (mimeType.includes("zip") || mimeType.includes("archive")) {
        return "bi-file-zip";
    }

    // Office documents
    if (mimeType.includes("word")) {
        return "bi-file-earmark-text";
    }
    if (mimeType.includes("sheet")) {
        return "bi-file-spreadsheet";
    }
    if (mimeType.includes("presentation")) {
        return "bi-file-slides";
    }

    switch (extension) {
        // Archives
        case "7z":
        case "rar":
        case "zip": {
            return "bi-file-zip";
        }

        case "app": {
            return "bi-terminal";
        }
        case "css": {
            return "bi-filetype-css";
        }
        case "csv": {
            return "bi-filetype-csv";
        }
        // Disk images
        case "dmg":
        case "iso": {
            return "bi-disc";
        }
        case "doc": {
            return "bi-filetype-doc";
        }

        // Office documents
        case "docx": {
            return "bi-filetype-docx";
        }
        // Executables
        case "exe": {
            return "bi-filetype-exe";
        }
        case "html": {
            return "bi-filetype-html";
        }
        case "java": {
            return "bi-filetype-java";
        }
        // Code files
        case "js": {
            return "bi-filetype-js";
        }
        // Data files
        case "json": {
            return "bi-filetype-json";
        }
        case "jsx":
        case "tsx": {
            return "bi-file-code";
        }
        case "md": {
            return "bi-filetype-md";
        }
        case "ppt": {
            return "bi-filetype-ppt";
        }
        case "pptx": {
            return "bi-filetype-pptx";
        }
        case "py": {
            return "bi-filetype-py";
        }
        case "sh": {
            return "bi-filetype-sh";
        }

        case "sql": {
            return "bi-filetype-sql";
        }
        case "ts": {
            return "bi-filetype-ts";
        }
        case "txt": {
            return "bi-filetype-txt";
        }
        case "xls": {
            return "bi-filetype-xls";
        }

        case "xlsx": {
            return "bi-filetype-xlsx";
        }
        case "xml": {
            return "bi-filetype-xml";
        }

        case "yaml":
        case "yml": {
            return "bi-filetype-yml";
        }

        default: {
            return "bi-file-earmark";
        }
    }
};
