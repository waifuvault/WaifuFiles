import {NextResponse} from 'next/server';

interface Restriction {
    type: string;
    value: string | number;
}

export async function GET() {
    try {
        const response = await fetch('https://waifuvault.moe/rest/resources/restrictions');

        if (!response.ok) {
            throw new Error('Failed to fetch restrictions');
        }

        const restrictions: Restriction[] = await response.json();

        return NextResponse.json(restrictions, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        console.error('Failed to fetch restrictions:', error);

        const defaultRestrictions: Restriction[] = [
            {
                type: "MAX_FILE_SIZE",
                value: 1048576000 // 1GB default
            },
            {
                type: "BANNED_MIME_TYPE",
                value: "application/x-dosexec,application/x-executable,application/x-hdf5,application/x-java-archive,application/vnd.rar"
            }
        ];

        return NextResponse.json(defaultRestrictions);
    }
}