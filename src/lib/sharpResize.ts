import fs from 'fs';
import { promises as fsPromises } from 'fs';
import url from 'url';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';
import * as heicDecode from 'heic-decode';
import log from './log';
import config from '../config';
import type { ImageOptions } from './imagemagickcommand';

export interface SharpResizeError {
    status: number | string;
    url: string;
}

type SharpResizeCallback = (err: SharpResizeError | null, file?: string, cached?: boolean) => void;

export class SharpResizeJob {
    private options: ImageOptions;
    private callback: SharpResizeCallback;
    private cacheFileName: string;
    private cacheFilePath: string;

    constructor(options: ImageOptions, callback: SharpResizeCallback) {
        this.options = options;
        this.callback = callback;

        this.cacheFileName = this.generateCacheFilename();
        this.cacheFilePath = config.cacheDirectory + this.cacheFileName;
    }

    generateCacheFilename(): string {
        return (
            crypto.createHash('sha1').update(JSON.stringify(this.options)).digest('hex') +
            '.' +
            this.options.format
        );
    }

    async isAlreadyCached(filename: string): Promise<boolean> {
        try {
            await fsPromises.access(filename);
            return true;
        } catch {
            return false;
        }
    }

    async validateRemoteSource(): Promise<{ status: number | string; isImage: boolean }> {
        const parsedUrl = url.parse(this.options.url);
        if (!parsedUrl.hostname) {
            return { status: 400, isImage: false };
        }

        try {
            const response = await axios.head(this.options.url, {
                timeout: 5000,
            });

            if (response.status !== 200) {
                return { status: response.status, isImage: false };
            }

            const contentType = response.headers['content-type'];
            const isImage = contentType ? contentType.split('/')[0].includes('image') : false;

            return { status: 200, isImage };
        } catch (error: any) {
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                return { status: 'ETIMEDOUT', isImage: false };
            }
            if (error.response) {
                return { status: error.response.status, isImage: false };
            }
            return { status: 500, isImage: false };
        }
    }

    async downloadDirect(): Promise<void> {
        const source = this.options.url;
        const cacheFileStream = fs.createWriteStream(this.cacheFilePath);

        try {
            const response = await axios.get(source, {
                responseType: 'stream',
            });

            response.data.pipe(cacheFileStream);

            cacheFileStream.on('finish', () => {
                this.callback(null, this.cacheFilePath);
            });

            cacheFileStream.on('error', () => {
                this.callback({ status: 500, url: this.options.url });
            });
        } catch (error) {
            this.callback({ status: 500, url: this.options.url });
        }
    }

    async processWithSharp(): Promise<void> {
        try {
            const response = await axios.get(this.options.url, {
                responseType: 'arraybuffer',
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || '';

            let processedBuffer: Buffer;

            // Try to handle HEIC/HEIF files
            if (contentType.includes('heic') || contentType.includes('heif') ||
                this.options.url.toLowerCase().match(/\.(heic|heif)$/)) {
                try {
                    log.write('Processing HEIC/HEIF file with heic-decode');
                    const { width, height, data } = await heicDecode.decode({ buffer });
                    const rgbaBuffer = Buffer.from(data);

                    processedBuffer = await this.transformImage(
                        sharp(rgbaBuffer, {
                            raw: {
                                width,
                                height,
                                channels: 4,
                            },
                        })
                    );
                } catch (heicError) {
                    log.write('HEIC decode failed, trying with Sharp directly');
                    processedBuffer = await this.transformImage(sharp(buffer));
                }
            } else {
                // Regular image processing with Sharp
                processedBuffer = await this.transformImage(sharp(buffer));
            }

            await fsPromises.writeFile(this.cacheFilePath, processedBuffer);
            this.callback(null, this.cacheFilePath);
        } catch (error: any) {
            log.write('Sharp processing error: ' + error.message);
            this.callback({ status: 500, url: this.options.url });
        }
    }

    private async transformImage(sharpInstance: sharp.Sharp): Promise<Buffer> {
        const { action, width, height, format, quality } = this.options;

        // Apply resize/crop
        if (width && height) {
            if (action === 'crop') {
                sharpInstance.resize({
                    width: parseInt(width, 10),
                    height: parseInt(height, 10),
                    fit: 'cover',
                    position: this.mapGravityToSharp(),
                });
            } else {
                sharpInstance.resize({
                    width: parseInt(width, 10),
                    height: parseInt(height, 10),
                    fit: action === 'scale' ? 'fill' : 'inside',
                });
            }
        } else if (width) {
            sharpInstance.resize({ width: parseInt(width, 10) });
        } else if (height) {
            sharpInstance.resize({ height: parseInt(height, 10) });
        }

        // Apply format and quality
        const qualityNum = parseInt(quality, 10);

        if (format === 'jpg' || format === 'jpeg') {
            sharpInstance.jpeg({ quality: qualityNum });
        } else if (format === 'png') {
            sharpInstance.png({ quality: qualityNum });
        } else if (format === 'webp') {
            sharpInstance.webp({ quality: qualityNum });
        } else if (format === 'avif') {
            sharpInstance.avif({ quality: qualityNum });
        } else if (format === 'gif') {
            sharpInstance.gif();
        } else {
            // Default to the specified format
            sharpInstance.toFormat(format as any, { quality: qualityNum });
        }

        return await sharpInstance.toBuffer();
    }

    private mapGravityToSharp(): string {
        const gravityMap: Record<string, string> = {
            'nw': 'northwest',
            'n': 'north',
            'ne': 'northeast',
            'w': 'west',
            'c': 'center',
            'e': 'east',
            'sw': 'southwest',
            's': 'south',
            'se': 'southeast',
        };
        return gravityMap[this.options.gravity] || 'center';
    }

    async startResize(): Promise<void> {
        const validation = await this.validateRemoteSource();

        if (validation.status !== 200) {
            console.log(validation.status);
            return this.callback({ status: validation.status, url: this.options.url });
        }

        const exists = await this.isAlreadyCached(this.cacheFilePath);

        if (exists) {
            log.write(new Date() + ' - CACHE HIT: ' + this.options.imagefile);
            this.callback(null, this.cacheFilePath, true);
        } else {
            if (validation.isImage) {
                log.write(new Date() + ' - SHARP RESIZE START: ' + this.options.imagefile);
                await this.processWithSharp();
            } else {
                log.write(new Date() + ' - DIRECT DOWNLOAD (non-image): ' + this.options.imagefile);
                await this.downloadDirect();
            }
        }
    }
}
