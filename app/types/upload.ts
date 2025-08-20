import { FileUpload, WaifuFile } from "waifuvault-node-api";

export interface Restriction {
    type: string;
    value: number | string;
}

export interface UploadItem {
    id: string; // stable identity for UI updates
    file: File;
    options: Partial<FileUpload>;
    status: "pending" | "queued" | "uploading" | "processing" | "completed" | "error";
    progress?: number;
    result?: WaifuFile;
    error?: string;
    uploadId?: string;
    showOptions?: boolean;
}
