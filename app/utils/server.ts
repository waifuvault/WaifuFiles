import { join } from "path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";

export const isDev = process.env.NODE_ENV === "development";

export const log = {
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },
    debugError: (...args: unknown[]) => {
        if (isDev) {
            console.error(...args);
        }
    },
    info: (...args: unknown[]) => {
        console.log(...args);
    },
    warn: (...args: unknown[]) => {
        console.warn(...args);
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    },
};

export async function cleanup(uploadId: string): Promise<NextResponse> {
    try {
        const tempDir = join(process.cwd(), "tmp", uploadId);

        await fs.rm(tempDir, { recursive: true });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false });
    }
}
