import Waifuvault, { FileUpload, WaifuError } from "waifuvault-node-api";
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
        const optionsString = formData.get("options") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Parse options if provided
        let options: Partial<FileUpload> = {};
        if (optionsString) {
            try {
                options = JSON.parse(optionsString);
            } catch {
                return NextResponse.json({ error: "Invalid options format" }, { status: 400 });
            }
        }

        // Validate expires format if provided
        if (options.expires && !/^$|^\d+[mhd]$/.test(options.expires)) {
            return NextResponse.json(
                {
                    error: "Invalid expires format. Use format like '1h', '30m', or '2d'",
                },
                { status: 400 },
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Prepare upload options
        const uploadOptions: FileUpload = {
            file: buffer,
            filename: file.name ?? "upload",
            bucketToken: bucketToken,
        };

        // Add optional parameters if they exist and are not empty
        if (options.expires && options.expires.trim() !== "") {
            uploadOptions.expires = options.expires;
        }

        if (options.hideFilename === true) {
            uploadOptions.hideFilename = true;
        }

        if (options.password && options.password.trim() !== "") {
            uploadOptions.password = options.password;
        }

        if (options.oneTimeDownload === true) {
            uploadOptions.oneTimeDownload = true;
        }

        // If a custom bucketToken is provided in options, use it instead
        if (options.bucketToken && options.bucketToken.trim() !== "") {
            uploadOptions.bucketToken = options.bucketToken;
        }

        const resp = await Waifuvault.uploadFile(uploadOptions);

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
