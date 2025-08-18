import { FileUpload, WaifuFile } from "waifuvault-node-api";

interface ChunkUploadOptions extends Partial<FileUpload> {
    filename: string;
}

export class ChunkedUploader {
    private static readonly CHUNK_SIZE = parseInt(process.env.NEXT_PUBLIC_CHUNK_SIZE ?? (5 * 1024 * 1024).toString());
    private static readonly CHUNK_TIMEOUT = 60000;
    private static readonly MAX_RETRIES = 3;
    private static readonly MAX_CONCURRENT_CHUNKS = 3;
    private static activeUploads = new Map<string, AbortController>();

    static {
        console.log("ChunkedUploader initialized with CHUNK_SIZE:", ChunkedUploader.CHUNK_SIZE);
    }

    static async uploadFile(
        file: File,
        options: ChunkUploadOptions,
        onProgress: (progress: number) => void,
        onProcessing: () => void,
        uploadId?: string,
    ): Promise<WaifuFile> {
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        const actualUploadId = uploadId ?? this.generateUploadId();
        const mainController = new AbortController();

        this.activeUploads.set(actualUploadId, mainController);

        try {
            await this.uploadChunksConcurrently(file, totalChunks, actualUploadId, mainController.signal, onProgress);

            if (mainController.signal.aborted) {
                throw new Error("Upload cancelled");
            }

            onProcessing();

            const result = await this.finalizeUploadWithProgress(actualUploadId, options, mainController.signal);

            this.activeUploads.delete(actualUploadId);
            return result;
        } catch (error) {
            this.activeUploads.delete(actualUploadId);

            try {
                await fetch("/api/upload/cleanup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadId: actualUploadId }),
                });
            } catch (cleanupError) {
                console.error("Cleanup failed:", cleanupError);
            }
            throw error;
        }
    }

    private static async uploadChunksConcurrently(
        file: File,
        totalChunks: number,
        uploadId: string,
        signal: AbortSignal,
        onProgress: (progress: number) => void,
    ): Promise<void> {
        const chunkProgress = new Array(totalChunks).fill(0);
        let nextChunkIndex = 0;
        const activePromises = new Set<Promise<void>>();

        const updateProgress = () => {
            const completedChunks = chunkProgress.reduce((sum, progress) => sum + progress, 0);
            const progress = Math.round((completedChunks / totalChunks) * 90);
            onProgress(progress);
        };

        const uploadNextChunk = async (): Promise<void> => {
            if (signal.aborted || nextChunkIndex >= totalChunks) {
                return;
            }

            const chunkIndex = nextChunkIndex++;
            const start = chunkIndex * this.CHUNK_SIZE;
            const end = Math.min(start + this.CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            await this.uploadChunkWithRetry(chunk, chunkIndex, totalChunks, uploadId, signal);
            chunkProgress[chunkIndex] = 1;
            updateProgress();

            if (nextChunkIndex < totalChunks && !signal.aborted) {
                const nextPromise = uploadNextChunk();
                activePromises.add(nextPromise);
                nextPromise.finally(() => activePromises.delete(nextPromise));
            }
        };

        for (let i = 0; i < Math.min(this.MAX_CONCURRENT_CHUNKS, totalChunks); i++) {
            const promise = uploadNextChunk();
            activePromises.add(promise);
            promise.finally(() => activePromises.delete(promise));
        }

        while (activePromises.size > 0) {
            await Promise.race(activePromises);
        }

        if (signal.aborted) {
            throw new Error("Upload cancelled");
        }
    }

    static cancelUpload(uploadId: string): void {
        const controller = this.activeUploads.get(uploadId);
        if (controller) {
            controller.abort();
            this.activeUploads.delete(uploadId);

            fetch("/api/upload/cleanup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId }),
            }).catch(() => {});
        } else {
            console.log("No controller found for uploadId:", uploadId);
        }
    }

    static getUploadId(file: File, options: ChunkUploadOptions): string {
        const optionsString = JSON.stringify(options);
        const baseString = `${file.name}-${file.size}-${file.lastModified}-${optionsString}`;
        return (
            btoa(baseString)
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 20) + Date.now().toString().slice(-6)
        );
    }

    private static async finalizeUploadWithProgress(
        uploadId: string,
        options: ChunkUploadOptions,
        signal?: AbortSignal,
    ): Promise<WaifuFile> {
        const MAX_FINALIZE_ATTEMPTS = 3;
        const INITIAL_TIMEOUT = 300000; // 5 minutes

        for (let attempt = 1; attempt <= MAX_FINALIZE_ATTEMPTS; attempt++) {
            const timeout = INITIAL_TIMEOUT * attempt;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const combinedSignal = signal ? this.combineSignals([signal, controller.signal]) : controller.signal;

            try {
                console.log(`Finalization attempt ${attempt}/${MAX_FINALIZE_ATTEMPTS} (timeout: ${timeout / 1000}s)`);

                const response = await fetch("/api/upload/finalize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadId, options }),
                    signal: combinedSignal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                return response.json();
            } catch (error) {
                clearTimeout(timeoutId);

                if ((error as Error).name === "AbortError") {
                    if (signal?.aborted) {
                        throw new Error("Upload cancelled");
                    }
                    if (attempt === MAX_FINALIZE_ATTEMPTS) {
                        throw new Error(
                            `Upload finalization failed after ${MAX_FINALIZE_ATTEMPTS} attempts - file may be too large`,
                        );
                    }
                    console.warn(`Finalization attempt ${attempt} timed out, retrying...`);
                    continue;
                }

                throw error;
            }
        }

        throw new Error("Finalization failed after all retry attempts");
    }

    private static async uploadChunkWithRetry(
        chunk: Blob,
        chunkIndex: number,
        totalChunks: number,
        uploadId: string,
        signal?: AbortSignal,
        retryCount = 0,
    ): Promise<void> {
        try {
            await this.uploadChunk(chunk, chunkIndex, totalChunks, uploadId, signal);
        } catch (error) {
            if ((error as Error).name === "AbortError" && signal?.aborted) {
                throw new Error("Upload cancelled");
            }

            if (retryCount < this.MAX_RETRIES) {
                console.warn(`Chunk ${chunkIndex} failed, retrying (${retryCount + 1}/${this.MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.uploadChunkWithRetry(chunk, chunkIndex, totalChunks, uploadId, signal, retryCount + 1);
            }
            throw new Error(`Chunk ${chunkIndex} failed after ${this.MAX_RETRIES} retries: ${error}`);
        }
    }

    private static async uploadChunk(
        chunk: Blob,
        chunkIndex: number,
        totalChunks: number,
        uploadId: string,
        signal?: AbortSignal,
    ): Promise<void> {
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("uploadId", uploadId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.CHUNK_TIMEOUT);

        const combinedSignal = signal ? this.combineSignals([signal, controller.signal]) : controller.signal;

        try {
            const response = await fetch("/api/upload/chunk", {
                method: "POST",
                body: formData,
                signal: combinedSignal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if ((error as Error).name === "AbortError") {
                if (signal?.aborted) {
                    throw new Error("Upload cancelled");
                }
                throw new Error(`Chunk ${chunkIndex} timed out`);
            }
            throw error;
        }
    }

    private static generateUploadId(): string {
        return Date.now().toString() + Math.random().toString(36).slice(2, 11);
    }

    private static combineSignals(signals: AbortSignal[]): AbortSignal {
        const controller = new AbortController();

        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort();
                break;
            }
            signal.addEventListener("abort", () => controller.abort(), { once: true });
        }

        return controller.signal;
    }
}
