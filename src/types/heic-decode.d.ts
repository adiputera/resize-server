declare module 'heic-decode' {
    export interface DecodeOptions {
        buffer: Buffer | ArrayBuffer;
    }

    export interface DecodeResult {
        width: number;
        height: number;
        data: Uint8ClampedArray;
    }

    export function decode(options: DecodeOptions): Promise<DecodeResult>;
}
