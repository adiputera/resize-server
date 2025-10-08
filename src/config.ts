import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Parse blob storage URLs from environment variables
// Format: BLOB_URL_<NAME>=<base-url>
// Example: BLOB_URL_SAMPLE_BLOB=example.blob.core.windows.net
function parseBlobStorageUrls(): Record<string, string> {
    const blobUrls: Record<string, string> = {};
    const prefix = 'BLOB_URL_';

    for (const key in process.env) {
        if (key.startsWith(prefix)) {
            const blobName = key.substring(prefix.length).toLowerCase().replace(/_/g, '-');
            const baseUrl = process.env[key];
            if (baseUrl) {
                blobUrls[blobName] = baseUrl;
            }
        }
    }

    return blobUrls;
}

export interface CacheHeader {
    maxAge: number;
    expires: number;
}

export interface Config {
    appPort: number;
    appStdOut: boolean;
    convertCmd: string;
    cacheDirectory: string;
    tmpDirectory: string;
    cacheHeader: CacheHeader;
    blobStorageUrls: Record<string, string>;
}

const config: Config = {
    appPort: parseInt(process.env.PORT || '7071', 10),
    appStdOut: true,
    convertCmd: 'convert',
    cacheDirectory: path.join(__dirname, '../cache/'),
    tmpDirectory: '/tmp/',
    cacheHeader: {
        maxAge: 315360000,
        expires: 1209600000,
    },
    blobStorageUrls: parseBlobStorageUrls(),
};

export default config;
