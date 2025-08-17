import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { cleanup, log } from "@/app/utils/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const maxChunkSize = parseInt(process.env.CHUNK_SIZE ?? (5 * 1024 * 1024).toString());

export async function POST(req: NextRequest) {
    let uploadId: string | undefined;

    try {
        const formData = await req.formData();
        const chunk = formData.get("chunk") as File;
        uploadId = formData.get("uploadId") as string;

        req.signal.addEventListener("abort", async () => {
            if (uploadId) {
                log.debug(`Request aborted, cleaning up temp files for upload ${uploadId}`);
                await cleanup(uploadId);
            }
        });

        if (chunk.size > maxChunkSize) {
            return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
        }

        const chunkIndex = parseInt(formData.get("chunkIndex") as string);
        const totalChunks = parseInt(formData.get("totalChunks") as string);

        const tempDir = join(process.cwd(), "tmp", uploadId);
        await mkdir(tempDir, { recursive: true });

        const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
        const chunkPath = join(tempDir, `chunk_${chunkIndex}`);
        await writeFile(chunkPath, chunkBuffer);

        return NextResponse.json({
            message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
            chunkIndex,
            totalChunks,
        });
    } catch (error) {
        log.error("Chunk upload error:", error);

        if (uploadId) {
            log.debug(`Chunk upload failed, cleaning up temp files for upload ${uploadId}`);
            await cleanup(uploadId);
        }

        return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
    }
}
