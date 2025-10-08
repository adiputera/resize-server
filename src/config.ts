import path from 'path';

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
}

const config: Config = {
    appPort: parseInt(process.env.PORT || '5060', 10),
    appStdOut: true,
    convertCmd: 'convert',
    cacheDirectory: path.join(__dirname, '../cache/'),
    tmpDirectory: '/tmp/',
    cacheHeader: {
        maxAge: 315360000,
        expires: 1209600000,
    },
};

export default config;
