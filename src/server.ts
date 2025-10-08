import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import config from './config';
import log from './lib/log';
import RequestSplitter from './lib/requestsplitter';
import { ResizeJob } from './lib/resize';
import { SharpResizeJob } from './lib/sharpResize';
import type { ImageOptions, GravityType } from './lib/imagemagickcommand';

// Ensure cache directory exists
if (!fs.existsSync(config.cacheDirectory)) {
    fs.mkdirSync(config.cacheDirectory, { recursive: true });
}

const app = express();

// Express 4.x middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// Remove X-Powered-By header
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
});

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

    // Parse size parameter (e.g., "300x300", "w300", "h300", "c300x300")
    if (size) {
        const cropMatch = size.match(/^c?(\d+)x(\d+)$/i);
        const widthMatch = size.match(/^w(\d+)$/i);
        const heightMatch = size.match(/^h(\d+)$/i);

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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.send('OK').end();
});

// Help page
app.get('/', (req: Request, res: Response) => {
    const params = {
        layout: false,
        hostname: req.headers.host,
    };
    res.render('help', params);
});

// New blob storage endpoint with query parameters (ImageMagick)
// Format: /resize/:blobName/path/to/image.jpg?s=300x300&f=png&g=c&m=crop&q=90
// Size (s) is optional - if omitted, only format conversion is performed
// Supported formats: jpg, png, webp, heic, and any ImageMagick-supported format
app.get('/resize/:blobName/*', (req: Request, res: Response) => {
    const now = new Date().getTime();
    const jobStartTime = now;
    const blobName = req.params.blobName;
    const imagePath = req.params[0]; // Captures everything after /resize/:blobName/

    // Check if blob storage URL exists in config
    const baseUrl = config.blobStorageUrls[blobName];
    if (!baseUrl) {
        res.status(404).json({
            status: 404,
            message: `Blob storage '${blobName}' not found. Available storages: ${Object.keys(config.blobStorageUrls).join(', ')}`,
        });
        return;
    }

    // Construct full URL
    const protocol = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') ? '' : 'https://';
    const fullUrl = `${protocol}${baseUrl}/${imagePath}`;

    try {
        const options = parseQueryOptions(req.query as Record<string, any>, fullUrl, imagePath);

        const rj = new ResizeJob(options, (err, file, cached): void => {
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

        rj.startResize();
    } catch (error) {
        res.status(400).json({ status: 400, message: 'Invalid request format' });
    }
});

// New blob storage endpoint with query parameters (Sharp + HEIC support)
// Format: /media/:blobName/path/to/image.jpg?s=300x300&f=png&g=c&m=crop&q=90
// Size (s) is optional - if omitted, only format conversion is performed
// Supported formats: jpg, png, webp, heic, heif, avif, gif
app.get('/media/:blobName/*', (req: Request, res: Response) => {
    const now = new Date().getTime();
    const jobStartTime = now;
    const blobName = req.params.blobName;
    const imagePath = req.params[0]; // Captures everything after /media/:blobName/

    // Check if blob storage URL exists in config
    const baseUrl = config.blobStorageUrls[blobName];
    if (!baseUrl) {
        res.status(404).json({
            status: 404,
            message: `Blob storage '${blobName}' not found. Available storages: ${Object.keys(config.blobStorageUrls).join(', ')}`,
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

// Main resize endpoint
app.get(RequestSplitter.urlMatch, (req: Request, res: Response) => {
    const now = new Date().getTime();
    const jobStartTime = now;

    try {
        const rs = new RequestSplitter(req.path, req.query as Record<string, string>);
        const options = rs.mapOptions();

        const rj = new ResizeJob(options, (err, file, cached): void => {
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

        rj.startResize();
    } catch (error) {
        res.status(400).json({ status: 400, message: 'Invalid request format' });
    }
});

// Start server
log.write('resize server listening on ' + config.appPort);
app.listen(config.appPort);

export default app;
