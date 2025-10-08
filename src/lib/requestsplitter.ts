import path from 'path';
import { ImageOptions, GravityType } from './imagemagickcommand';

function fixUrlProtocol(url: string): string {
    return url.replace(/^([a-z]+:)\/+([^/])/, '$1//$2');
}

export default class RequestSplitter {
    public static urlMatch = new RegExp(
        [
            '^/?(c|w|h)?([0-9]+)x?([0-9]+)?,?',
            '(c|e|w|n(?:e|w)?|s(?:e|w)?)?',
            '/?(png|jpg)?,?([0-9]+)?',
            '/(.*)$',
        ].join('')
    );

    private url: string;
    private query: Record<string, string>;

    constructor(url: string, query: Record<string, string> = {}) {
        this.url = url || '';
        this.query = query;
    }

    mapOptions(): ImageOptions {
        const param = this.url.match(RequestSplitter.urlMatch);

        if (!param) {
            throw new Error('Invalid URL format');
        }

        const fixedUrl = fixUrlProtocol(param[7]);

        const options: ImageOptions = {
            action: param[1] === 'c' ? 'crop' : 'resize',
            width: param[1] === 'h' ? '' : param[2],
            height: param[1] === 'w' ? '' : param[1] === 'h' ? param[2] : param[3],
            gravity: (param[4] as GravityType) || 'c',
            format: param[5] || 'jpg',
            quality: param[6] || '80',
            imagefile: fixedUrl,
            url: fixedUrl + this.buildQueryString(),
            suffix: '',
        };

        options.quality = String(Math.round(Math.min(100, Math.max(0, parseInt(options.quality, 10)))));
        options.suffix = path.extname(options.imagefile);

        return options;
    }

    private buildQueryString(): string {
        const queryArray: string[] = [];

        for (const key in this.query) {
            if (Object.prototype.hasOwnProperty.call(this.query, key)) {
                queryArray.push(`${key}=${encodeURIComponent(this.query[key])}`);
            }
        }

        return queryArray.length > 0 ? '?' + queryArray.join('&') : '';
    }
}
