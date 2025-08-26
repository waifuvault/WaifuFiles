import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import Waifuvault, { FileUpload } from "waifuvault-node-api";
import { cleanup, log } from "@/app/utils/server";
import process from "node:process";

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

    let clientIP: string | undefined;

    if (process.env.USE_CLOUDFLARE === "true" && req.headers.get("cf-connecting-ip")) {
        clientIP = req.headers.get("cf-connecting-ip") ?? undefined;
    } else {
        clientIP =
            req.headers.get("x-forwarded-for") ??
            req.headers.get("x-real-ip") ??
            req.headers.get("cf-connecting-ip") ??
            req.headers.get("x-forwarded-for") ??
            undefined;
    }

    if (clientIP) {
        clientIP = extractIp(clientIP);
    }

    let uploadId: string | undefined;

    try {
        const { uploadId: reqUploadId, options }: FinalizeUploadRequest = await req.json();
        uploadId = reqUploadId;

        if (options.expires && !/^$|^\d+[mhd]$/.test(options.expires)) {
            return NextResponse.json(
                {
                    error: "Invalid expires format. Use format like '1h', '30m', or '2d'",
                },
                { status: 400 },
            );
        }

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
            clientIP,
        };

        if (restOptions.expires && restOptions.expires.trim() !== "") {
            uploadOptions.expires = restOptions.expires;
        }

        if (restOptions.hideFilename === true) {
            uploadOptions.hideFilename = true;
        }

        if (restOptions.password && restOptions.password.trim() !== "") {
            uploadOptions.password = restOptions.password;
        }

        if (restOptions.oneTimeDownload === true) {
            uploadOptions.oneTimeDownload = true;
        }

        if (restOptions.bucketToken && restOptions.bucketToken.trim() !== "") {
            uploadOptions.bucketToken = restOptions.bucketToken;
        }

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

function extractIp(ipString: string): string {
    const ipSplit = ipString.split(":");
    if (ipSplit.length === 1 || (ipSplit.length > 2 && !ipString.includes("]"))) {
        return ipString;
    }
    if (ipSplit.length === 2) {
        return ipSplit[0];
    }
    return ipSplit
        .slice(0, ipSplit.length - 1)
        .join(":")
        .replace(/\[/, "")
        .replace(/]/, "");
}
