export type GravityType = 'nw' | 'n' | 'ne' | 'w' | 'c' | 'e' | 'sw' | 's' | 'se';

export interface ImageOptions {
    action: 'crop' | 'resize' | 'scale';
    width: string;
    height: string;
    gravity: GravityType;
    format: string;
    quality: string;
    imagefile: string;
    url: string;
    suffix: string;
}

export interface FileOptions {
    tmp: string;
    cache: string;
}

abstract class AbstractImageMagickCommand {
    protected options: ImageOptions;
    protected files: FileOptions;
    protected convertCmd: string;
    protected gravityName: Record<GravityType, string>;

    constructor(options: ImageOptions, files: FileOptions, convertCmd = 'convert') {
        this.options = options;
        this.files = files;
        this.convertCmd = convertCmd;

        this.gravityName = {
            nw: 'NorthWest',
            n: 'North',
            ne: 'NorthEast',
            w: 'West',
            c: 'Center',
            e: 'East',
            sw: 'SouthWest',
            s: 'South',
            se: 'SouthEast',
        };
    }

    buildCommandString(): string[] {
        const imCommand = [
            this.convertCmd,
            this.files.tmp,
            this.buildActionString(),
            '+repage',
            '-quality',
            this.options.quality,
            '-format',
            this.options.format,
            '-background',
            'white',
            '-flatten',
            this.files.cache,
        ].join(' ');

        return imCommand.split(' ');
    }

    abstract buildActionString(): string;

    protected buildDimensionString(): string {
        return `${this.options.width}x${this.options.height}`;
    }
}

class ResizeImageMagickCommand extends AbstractImageMagickCommand {
    buildActionString(): string {
        return `-resize ${this.buildDimensionString()}`;
    }
}

class ScaleImageMagickCommand extends AbstractImageMagickCommand {
    buildActionString(): string {
        return `-scale ${this.buildDimensionString()}`;
    }
}

class CropImageMagickCommand extends AbstractImageMagickCommand {
    buildActionString(): string {
        return [
            `-thumbnail ${this.buildDimensionString()}^>`,
            `-gravity ${this.gravityName[this.options.gravity]}`,
            `-crop ${this.buildDimensionString()}+0+0`,
        ].join(' ');
    }
}

export default function ImageMagickCommand(
    options: ImageOptions,
    files: FileOptions,
    convertCmd?: string
): AbstractImageMagickCommand {
    if (options.action === 'crop') {
        return new CropImageMagickCommand(options, files, convertCmd);
    } else if (options.width && options.height) {
        return new ScaleImageMagickCommand(options, files, convertCmd);
    } else {
        return new ResizeImageMagickCommand(options, files, convertCmd);
    }
}
