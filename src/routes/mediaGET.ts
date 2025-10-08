import { Router, Request, Response } from 'express';
import config from '../config';
import { SharpResizeJob } from '../lib/sharpResize';
import type { ImageOptions, GravityType } from '../lib/imagemagickcommand';
import path from 'path';

const router = Router();

// Helper function to parse query parameters into ImageOptions
function parseQueryOptions(query: Record<string, any>, fullUrl: string, imagePath: string): ImageOptions {
    const size = query.s || '';
    const format = (query.f || 'png').toLowerCase();
    const gravity = (query.g || 'c') as GravityType;
    const mode = (query.m || 'resize').toLowerCase();
    const quality = query.q || '80';

    let action: 'crop' | 'resize' | 'scale' = 'resize';
    let width = '';
    let height = '';

    // Parse size parameter (e.g., "300x300", "w300", "h300", "c300x300", or just "300")
    if (size) {
        const cropMatch = size.match(/^c?(\d+)x(\d+)$/i);
        const widthMatch = size.match(/^w(\d+)$/i);
        const heightMatch = size.match(/^h(\d+)$/i);
        const numberOnly = size.match(/^(\d+)$/);

        if (size.startsWith('c') && cropMatch) {
            action = 'crop';
            width = cropMatch[1];
            height = cropMatch[2];
        } else if (cropMatch) {
            action = mode === 'crop' ? 'crop' : 'scale';
            width = cropMatch[1];
            height = cropMatch[2];
        } else if (widthMatch) {
            action = 'resize';
            width = widthMatch[1];
            height = '';
        } else if (heightMatch) {
            action = 'resize';
            width = '';
            height = heightMatch[1];
        } else if (numberOnly) {
            // Plain number means width
            action = 'resize';
            width = numberOnly[1];
            height = '';
        }
    }

    // Override action if mode is explicitly set
    if (mode === 'crop' || mode === 'scale') {
        action = mode as 'crop' | 'scale';
    }

    const sanitizedQuality = String(Math.round(Math.min(100, Math.max(0, parseInt(quality, 10) || 80))));

    return {
        action,
        width,
        height,
        gravity,
        format,
        quality: sanitizedQuality,
        imagefile: fullUrl,
        url: fullUrl,
        suffix: path.extname(imagePath),
    };
}

// GET /media/:blobName/* - Sharp-based processing with heic-decode support
// Format: /media/:blobName/path/to/image.jpg?s=300x300&f=png&g=c&m=crop&q=90
// Size (s) is optional - if omitted, only format conversion is performed
// Supported formats: jpg, png, webp, heic, heif, avif, gif
router.get('/media/:blobName/*', (req: Request, res: Response) => {
    const now = new Date().getTime();
    const jobStartTime = now;
    const blobName = req.params.blobName;
    const imagePath = req.params[0]; // Captures everything after /media/:blobName/

    // Check if blob storage URL exists in config
    const baseUrl = config.blobStorageUrls[blobName];
    if (!baseUrl) {
        res.status(404).json({
            status: 404,
            message: `Blob storage '${blobName}' not found.`,
        });
        return;
    }

    // Construct full URL
    const protocol = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') ? '' : 'https://';
    const fullUrl = `${protocol}${baseUrl}/${imagePath}`;

    try {
        const options = parseQueryOptions(req.query as Record<string, any>, fullUrl, imagePath);

        const srj = new SharpResizeJob(options, (err, file, cached): void => {
            if (err) {
                res.status(typeof err.status === 'number' ? err.status : 500).json(err);
                return;
            }

            if (!file) {
                res.status(500).json({ status: 500, message: 'Resize failed' });
                return;
            }

            const jobEndTime = new Date().getTime();
            const jobDuration = cached ? 0 : jobEndTime - jobStartTime;

            res.setHeader('X-ResizeJobDuration', String(jobDuration));
            res.setHeader('Expires', new Date(now + config.cacheHeader.expires).toUTCString());

            res.sendFile(file, { maxAge: config.cacheHeader.maxAge });
        });

        srj.startResize();
    } catch (error) {
        res.status(400).json({ status: 400, message: 'Invalid request format' });
    }
});

export default router;
