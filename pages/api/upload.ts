import {NextApiRequest, NextApiResponse} from 'next';
import Waifuvault from 'waifuvault-node-api';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const bucketToken = process.env.WAIFUVAULT_BUCKET_TOKEN;

    if (!bucketToken) {
        return res.status(500).json({ error: 'Bucket token not configured' });
    }

    try {
        const form = formidable({});
        const [, files] = await form.parse(req);

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Read the file as a buffer
        const fileBuffer = fs.readFileSync(file.filepath);

        const resp = await Waifuvault.uploadFile({
            file: fileBuffer,
            filename: file.originalFilename || 'upload',
            bucketToken: bucketToken
        });

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        res.status(200).json(resp);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
}