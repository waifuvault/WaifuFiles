import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import Waifuvault, { FileUpload } from "waifuvault-node-api";
import { cleanup, log } from "@/app/utils/server";

interface ChunkUploadOptions extends Partial<FileUpload> {
    filename: string;
}

interface FinalizeUploadRequest {
    uploadId: string;
    options: ChunkUploadOptions;
}

export const runtime = "nodejs";
export const maxDuration = 900; // 15 minutes

export async function POST(req: NextRequest) {
    const bucketToken = process.env.WAIFUVAULT_BUCKET_TOKEN;

    if (!bucketToken) {
        return NextResponse.json({ error: "Bucket token not configured" }, { status: 500 });
    }

    let uploadId: string | undefined;

    try {
        const { uploadId: reqUploadId, options }: FinalizeUploadRequest = await req.json();
        uploadId = reqUploadId;
        const tempDir = join(process.cwd(), "tmp", uploadId);

        try {
            await readdir(tempDir);
        } catch {
            return NextResponse.json({ error: "Upload chunks not found - upload may have expired" }, { status: 404 });
        }

        const chunkFiles = await readdir(tempDir);
        chunkFiles.sort((a, b) => {
            const indexA = parseInt(a.split("_")[1]);
            const indexB = parseInt(b.split("_")[1]);
            return indexA - indexB;
        });

        if (chunkFiles.length === 0) {
            return NextResponse.json({ error: "No chunks found for upload" }, { status: 400 });
        }

        const chunks: Buffer[] = [];
        let totalSize = 0;

        for (const chunkFile of chunkFiles) {
            const chunkPath = join(tempDir, chunkFile);
            const chunkBuffer = await readFile(chunkPath);
            chunks.push(chunkBuffer);
            totalSize += chunkBuffer.length;

            if (totalSize > 100 * 1024 * 1024) {
                log.debug(`Processed ${Math.round(totalSize / 1024 / 1024)}MB of chunks`);
            }
        }

        log.debug(`Combining ${chunks.length} chunks (${Math.round(totalSize / 1024 / 1024)}MB total)`);
        const finalBuffer = Buffer.concat(chunks);

        const { filename, ...restOptions } = options;

        const uploadOptions: FileUpload = {
            bucketToken,
            file: finalBuffer,
            filename,
            ...restOptions,
        };

        log.debug(`Starting WaifuVault upload for ${filename} (${Math.round(finalBuffer.length / 1024 / 1024)}MB)`);

        const result = await Waifuvault.uploadFile(uploadOptions, req.signal);
        log.debug(`WaifuVault upload completed: ${result.url}`);

        await cleanup(uploadId);

        return NextResponse.json(result);
    } catch (error) {
        log.debugError("Finalize upload error:", error);

        if (uploadId) {
            await cleanup(uploadId);
        }

        if (error instanceof Error) {
            if (error.message.includes("ENOENT")) {
                return NextResponse.json({ error: "Upload chunks not found" }, { status: 404 });
            }
            if (error.message.includes("timeout")) {
                return NextResponse.json({ error: "WaifuVault upload timed out" }, { status: 408 });
            }
            if (error.message.includes("ENOMEM")) {
                return NextResponse.json({ error: "Server out of memory - file too large" }, { status: 413 });
            }
            if (error.name === "AbortError") {
                return NextResponse.json({ error: "Upload cancelled" }, { status: 499 });
            }
        }

        return NextResponse.json(
            {
                error: "Failed to finalize upload",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
