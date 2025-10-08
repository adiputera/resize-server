import { expect } from 'chai';
import ImageMagickCommand from '../src/lib/imagemagickcommand';
import type { ImageOptions, FileOptions } from '../src/lib/imagemagickcommand';

describe('ImageMagickCommand', () => {
    it('is a function', () => {
        expect(ImageMagickCommand).to.be.a('function');
    });

    it('assigns first param to options', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im['options']).to.equal(options);
    });

    it('assigns second param to files', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im['files']).to.equal(files);
    });

    describe('files', () => {
        it('has properties tmp and cache', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '200',
                height: '400',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'test.jpg',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const files: FileOptions = {
                tmp: 'tmp',
                cache: 'cache',
            };
            const im = ImageMagickCommand(options, files);
            expect(im['files'].tmp).to.equal('tmp');
            expect(im['files'].cache).to.equal('cache');
        });
    });

    it('assigns third param to convertCmd', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files, 'customConvert');
        expect(im['convertCmd']).to.equal('customConvert');
    });

    it('assigns "convert" to convertCmd if third param is missing', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im['convertCmd']).to.equal('convert');
    });

    it('has a property gravityName', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im['gravityName']).to.exist;
    });

    it('has a method buildDimensionString', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im['buildDimensionString']).to.be.a('function');
    });

    describe('buildDimensionString()', () => {
        it('returns a dimension string "200x400"', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '200',
                height: '400',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'test.jpg',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const files: FileOptions = {
                tmp: 'tmp',
                cache: 'cache',
            };
            const im = ImageMagickCommand(options, files);
            expect(im['buildDimensionString']()).to.equal('200x400');
        });
    });

    it('has a method buildActionString', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im.buildActionString).to.be.a('function');
    });

    describe('buildActionString()', () => {
        it('returns a string', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '200',
                height: '400',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'test.jpg',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const files: FileOptions = {
                tmp: 'tmp',
                cache: 'cache',
            };
            const im = ImageMagickCommand(options, files);
            expect(im.buildActionString()).to.be.a('string');
        });
    });

    it('has a method buildCommandString', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '200',
            height: '400',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'test.jpg',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const files: FileOptions = {
            tmp: 'tmp',
            cache: 'cache',
        };
        const im = ImageMagickCommand(options, files);
        expect(im.buildCommandString).to.be.a('function');
    });

    describe('buildCommandString()', () => {
        it('returns an array', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '200',
                height: '400',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'test.jpg',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const files: FileOptions = {
                tmp: 'tmp',
                cache: 'cache',
            };
            const im = ImageMagickCommand(options, files);
            expect(im.buildCommandString()).to.be.an('array');
        });
    });
});
