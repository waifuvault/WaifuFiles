import { FileUpload, WaifuFile } from "waifuvault-node-api";

export interface UploadItem {
    file: File;
    status: "pending" | "uploading" | "completed" | "error";
    result?: WaifuFile;
    error?: string;
    progress?: number;
    options: Partial<FileUpload>;
    showOptions?: boolean;
}

export interface Restriction {
    type: string;
    value: string | number;
}
