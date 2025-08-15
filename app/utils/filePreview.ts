export interface FilePreview {
    type: "image" | "video" | "audio" | "pdf" | "text" | "unknown";
    url?: string;
    content?: string;
    error?: string;
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
        file.name.match(/\.(txt|md|js|ts|jsx|tsx|css|html|xml|yml|yaml|json|csv)$/i)
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
        reader.onload = e => {
            resolve({
                type: "image",
                url: e.target?.result as string,
            });
        };
        reader.onerror = () => {
            resolve({
                type: "image",
                error: "Failed to load image",
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

        video.onloadedmetadata = () => {
            video.currentTime = video.duration * 0.1;
        };

        video.onseeked = () => {
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
                    type: "video",
                    error: "Failed to generate thumbnail",
                });
            }

            URL.revokeObjectURL(video.src);
        };

        video.onerror = () => {
            resolve({
                type: "video",
                error: "Failed to load video",
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
                type: "text",
                content: "File too large for preview",
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            const content = e.target?.result as string;
            const preview = content.length > 500 ? content.substring(0, 500) + "..." : content;

            resolve({
                type: "text",
                content: preview,
            });
        };
        reader.onerror = () => {
            resolve({
                type: "text",
                error: "Failed to read file",
            });
        };
        reader.readAsText(file);
    });
};

export const generateFilePreview = async (file: File): Promise<FilePreview> => {
    const fileType = getFileType(file);

    try {
        switch (fileType) {
            case "image":
                return await generateImagePreview(file);
            case "video":
                return await generateVideoPreview(file);
            case "text":
                return await generateTextPreview(file);
            case "audio":
                return {
                    type: "audio",
                    url: URL.createObjectURL(file),
                };
            case "pdf":
                return {
                    type: "pdf",
                    url: URL.createObjectURL(file),
                };
            default:
                return {
                    type: "unknown",
                };
        }
    } catch {
        return {
            type: fileType,
            error: "Failed to generate preview",
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
        case "zip":
        case "rar":
        case "7z":
            return "bi-file-zip";

        // Office documents
        case "docx":
            return "bi-filetype-docx";
        case "doc":
            return "bi-filetype-doc";
        case "xlsx":
            return "bi-filetype-xlsx";
        case "xls":
            return "bi-filetype-xls";
        case "pptx":
            return "bi-filetype-pptx";
        case "ppt":
            return "bi-filetype-ppt";

        // Code files
        case "js":
            return "bi-filetype-js";
        case "ts":
            return "bi-filetype-ts";
        case "jsx":
        case "tsx":
            return "bi-file-code";
        case "sql":
            return "bi-filetype-sql";
        case "css":
            return "bi-filetype-css";
        case "html":
            return "bi-filetype-html";
        case "xml":
            return "bi-filetype-xml";
        case "java":
            return "bi-filetype-java";
        case "yaml":
        case "yml":
            return "bi-filetype-yml";
        case "py":
            return "bi-filetype-py";
        case "sh":
            return "bi-filetype-sh";

        // Data files
        case "json":
            return "bi-filetype-json";
        case "csv":
            return "bi-filetype-csv";
        case "md":
            return "bi-filetype-md";
        case "txt":
            return "bi-filetype-txt";

        // Executables
        case "exe":
            return "bi-filetype-exe";
        case "app":
            return "bi-terminal";

        // Disk images
        case "dmg":
        case "iso":
            return "bi-disc";

        default:
            return "bi-file-earmark";
    }
};
