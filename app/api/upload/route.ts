import Waifuvault, { WaifuError } from "waifuvault-node-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const bucketToken = process.env.WAIFUVAULT_BUCKET_TOKEN;

    if (!bucketToken) {
        return NextResponse.json({ error: "Bucket token not configured" }, { status: 500 });
    }

    try {
        // Parse the FormData from the request
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const resp = await Waifuvault.uploadFile({
            file: buffer,
            filename: file.name || "upload",
            bucketToken: bucketToken,
        });

        return NextResponse.json(resp);
    } catch (error) {
        console.error("Upload error:", error);

        // Check if it's a WaifuVault API error
        if (error && typeof error === "object" && "name" in error && "message" in error && "status" in error) {
            const waifuError = error as WaifuError;
            return NextResponse.json(
                {
                    error: waifuError.message,
                    name: waifuError.name,
                    status: waifuError.status,
                },
                { status: waifuError.status },
            );
        }

        // Generic error fallback
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
