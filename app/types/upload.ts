import { FileUpload, WaifuFile } from "waifuvault-node-api";

export interface Restriction {
    type: string;
    value: number | string;
}

export interface UploadItem {
    error?: string;
    file: File;
    options: Partial<FileUpload>;
    progress?: number;
    result?: WaifuFile;
    showOptions?: boolean;
    status: "completed" | "error" | "pending" | "processing" | "uploading";
}
