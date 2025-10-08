import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import * as heicDecode from 'heic-decode';

const router = Router();

// POST /media - Upload and process image with JWT authentication
// Requires Bearer token in Authorization header
// Query params: s (size), f (format), g (gravity), m (mode), q (quality)
router.post('/media', async (req: Request, res: Response) => {
    try {
        const bearerToken = req.headers.authorization;
        if (bearerToken && bearerToken.startsWith('Bearer ')) {
            const token = bearerToken.split(' ')[1];
            if (token) {
                const jwtSecretKey = process.env['jwt_secret_key'];
                if (!jwtSecretKey) {
                    return res.status(500).json({
                        error: 'JWT secret key not configured'
                    });
                }

                const decoded = jwt.verify(token, jwtSecretKey) as jwt.JwtPayload;
                if (decoded.sub && process.env[decoded.sub + '_auth_client']) {
                    try {
                        const chunks: Buffer[] = [];

                        req.on('data', (chunk: Buffer) => {
                            chunks.push(chunk);
                        });

                        req.on('end', async () => {
                            try {
                                let imageBuffer = Buffer.concat(chunks);
                                const query = req.query as Record<string, any>;

                                // Parse query parameters
                                const size = query.s || '';
                                const format = (query.f || 'png').toLowerCase();
                                const quality = parseInt(query.q || '80', 10);

                                let width: number | undefined;
                                let height: number | undefined;

                                // Parse size parameter (e.g., "300x300", "w300", "h300", or just "300")
                                if (size) {
                                    const sizeMatch = size.match(/^(\d+)x(\d+)$/);
                                    const widthMatch = size.match(/^w(\d+)$/);
                                    const heightMatch = size.match(/^h(\d+)$/);
                                    const numberOnly = size.match(/^(\d+)$/);

                                    if (sizeMatch) {
                                        width = parseInt(sizeMatch[1], 10);
                                        height = parseInt(sizeMatch[2], 10);
                                    } else if (widthMatch) {
                                        width = parseInt(widthMatch[1], 10);
                                    } else if (heightMatch) {
                                        height = parseInt(heightMatch[1], 10);
                                    } else if (numberOnly) {
                                        // Plain number means width
                                        width = parseInt(numberOnly[1], 10);
                                    }
                                }

                                let processedBuffer: Buffer;

                                // Try to process as HEIC first
                                try {
                                    const { width: heicWidth, height: heicHeight, data } = await heicDecode.decode({ buffer: imageBuffer });
                                    const rgbaBuffer = Buffer.from(data);

                                    let sharpImage = sharp(rgbaBuffer, {
                                        raw: {
                                            width: heicWidth,
                                            height: heicHeight,
                                            channels: 4
                                        }
                                    });

                                    // Apply resize if dimensions provided
                                    if (width && height) {
                                        sharpImage = sharpImage.resize({ width, height });
                                    } else if (width) {
                                        sharpImage = sharpImage.resize({ width });
                                    } else if (height) {
                                        sharpImage = sharpImage.resize({ height });
                                    }

                                    // Apply format
                                    processedBuffer = await applyFormat(sharpImage, format, quality);
                                } catch {
                                    // Not HEIC, process as regular image
                                    let sharpImage = sharp(imageBuffer);

                                    // Apply resize if dimensions provided
                                    if (width && height) {
                                        sharpImage = sharpImage.resize({ width, height });
                                    } else if (width) {
                                        sharpImage = sharpImage.resize({ width });
                                    } else if (height) {
                                        sharpImage = sharpImage.resize({ height });
                                    }

                                    // Apply format
                                    processedBuffer = await applyFormat(sharpImage, format, quality);
                                }

                                // Return the processed image
                                const contentType = getContentType(format);
                                res.setHeader('Content-Type', contentType);
                                res.setHeader('Content-Length', processedBuffer.length);
                                return res.send(processedBuffer);
                            } catch (error) {
                                console.error('Processing error:', error);
                                return res.status(500).json({
                                    error: `${error}`
                                });
                            }
                        });

                        return;
                    } catch (error) {
                        console.error('Request error:', error);
                        return res.status(500).json({
                            error: `${error}`
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
    }

    return res.status(401).json({
        error: 'Unauthorized'
    });
});

async function applyFormat(sharpImage: sharp.Sharp, format: string, quality: number): Promise<Buffer> {
    if (format === 'jpg' || format === 'jpeg') {
        return await sharpImage.jpeg({ quality }).toBuffer();
    } else if (format === 'png') {
        return await sharpImage.png({ quality }).toBuffer();
    } else if (format === 'webp') {
        return await sharpImage.webp({ quality }).toBuffer();
    } else if (format === 'avif') {
        return await sharpImage.avif({ quality }).toBuffer();
    } else if (format === 'gif') {
        return await sharpImage.gif().toBuffer();
    } else {
        return await sharpImage.toFormat(format as any, { quality }).toBuffer();
    }
}

function getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'avif': 'image/avif',
        'gif': 'image/gif',
        'heic': 'image/heic',
        'heif': 'image/heif'
    };
    return contentTypes[format] || 'image/png';
}

export default router;
