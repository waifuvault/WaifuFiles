import { NextRequest, NextResponse } from "next/server";
import { cleanup } from "@/app/utils/server";

export async function POST(req: NextRequest) {
    try {
        const { uploadId } = await req.json();
        return cleanup(uploadId);
    } catch {
        return NextResponse.json({ success: false });
    }
}
