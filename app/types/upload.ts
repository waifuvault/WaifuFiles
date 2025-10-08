import { FileUpload } from "waifuvault-node-api";

export interface Restriction {
    type: string;
    value: number | string;
}

export interface PublicFileInfo {
    url: string;
    options: {
        hideFilename: boolean;
        oneTimeDownload: boolean;
        protected: boolean;
    };
    retentionPeriod: string | number | null;
}

export interface UploadItem {
    id: string; // stable identity for UI updates
    file: File;
    options: Partial<FileUpload>;
    status: "pending" | "queued" | "uploading" | "processing" | "completed" | "error";
    progress?: number;
    result?: PublicFileInfo;
    error?: string;
    uploadId?: string;
    showOptions?: boolean;
}
