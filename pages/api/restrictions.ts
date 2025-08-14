import {NextApiRequest, NextApiResponse} from 'next';

interface Restriction {
    type: string;
    value: string | number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://waifuvault.moe/rest/resources/restrictions');

        if (!response.ok) {
            throw new Error('Failed to fetch restrictions');
        }

        const restrictions: Restriction[] = await response.json();

        // Cache for 1 hour since restrictions don't change often
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json(restrictions);
    } catch (error) {
        console.error('Failed to fetch restrictions:', error);

        // Return default values if API fails
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

        res.status(200).json(defaultRestrictions);
    }
}