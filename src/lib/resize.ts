import fs from 'fs';
import { promises as fsPromises } from 'fs';
import url from 'url';
import { spawn } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import log from './log';
import config from '../config';
import ImageMagickCommand from './imagemagickcommand';
import type { ImageOptions } from './imagemagickcommand';

export interface ResizeError {
    status: number | string;
    url: string;
}

type ResizeCallback = (err: ResizeError | null, file?: string, cached?: boolean) => void;

export class ResizeJob {
    private options: ImageOptions;
    private callback: ResizeCallback;
    private cacheFileName: string;
    private cacheFilePath: string;

    constructor(options: ImageOptions, callback: ResizeCallback) {
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
        // if remote url has no hostname end with status 400
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

    async resizeStream(): Promise<void> {
        const source = this.options.url;
        const cacheFileStream = fs.createWriteStream(this.cacheFilePath);

        const im = ImageMagickCommand(
            this.options,
            {
                tmp: '-',
                cache: '-',
            },
            config.convertCmd
        );

        const commandArgs = im.buildCommandString();
        log.write('ImageMagick command: ' + config.convertCmd + ' ' + commandArgs.join(' '));

        const convert = spawn(config.convertCmd, commandArgs);
        convert.stdout.pipe(cacheFileStream);

        // Log stderr for debugging
        convert.stderr.on('data', (data) => {
            log.write('ImageMagick stderr: ' + data.toString());
        });

        convert.on('close', (code) => {
            if (code === 0) {
                this.callback(null, this.cacheFilePath);
            } else {
                log.write(`ImageMagick process exited with code ${code}`);
                this.callback({ status: 500, url: this.options.url });
            }
        });

        convert.on('error', (err) => {
            log.write('ImageMagick error: ' + err.message);
            this.callback({ status: 500, url: this.options.url });
        });

        try {
            const response = await axios.get(source, {
                responseType: 'stream',
            });
            response.data.pipe(convert.stdin);
        } catch (error) {
            convert.kill();
            this.callback({ status: 500, url: this.options.url });
        }
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
                log.write(new Date() + ' - RESIZE START: ' + this.options.imagefile);
                await this.resizeStream();
            } else {
                log.write(new Date() + ' - DIRECT DOWNLOAD (non-image): ' + this.options.imagefile);
                await this.downloadDirect();
            }
        }
    }
}
