import { expect } from 'chai';
import crypto from 'crypto';
import { ResizeJob } from '../src/lib/resize';
import type { ImageOptions } from '../src/lib/imagemagickcommand';

describe('ResizeJob', () => {
    it('is a constructor function', () => {
        expect(ResizeJob).to.be.a('function');
    });

    it('has a method generateCacheFilename', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '100',
            height: '100',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'teststring',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const rj = new ResizeJob(options, () => { });
        expect(rj.generateCacheFilename).to.be.a('function');
    });

    it('has a method isAlreadyCached', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '100',
            height: '100',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'teststring',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const rj = new ResizeJob(options, () => { });
        expect(rj.isAlreadyCached).to.be.a('function');
    });

    it('has a method validateRemoteSource', () => {
        const options: ImageOptions = {
            action: 'resize',
            width: '100',
            height: '100',
            gravity: 'c',
            format: 'jpg',
            quality: '80',
            imagefile: 'teststring',
            url: 'http://example.com/test.jpg',
            suffix: '.jpg',
        };
        const rj = new ResizeJob(options, () => { });
        expect(rj.validateRemoteSource).to.be.a('function');
    });

    describe('generateCacheFilename()', () => {
        it('returns a string', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'teststring',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const rj = new ResizeJob(options, () => { });
            expect(rj.generateCacheFilename()).to.be.a('string');
        });

        it('returns correct shasum of options + suffix', () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'png',
                quality: '80',
                imagefile: 'teststring',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const rj = new ResizeJob(options, () => { });
            const shasum = crypto.createHash('sha1');
            shasum.update(JSON.stringify(options));
            const cache = shasum.digest('hex') + '.' + options.format;
            expect(rj.generateCacheFilename()).to.equal(cache);
        });
    });

    describe('isAlreadyCached()', () => {
        it('returns a boolean', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'teststring',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const filename = 'resize.spec.ts';
            const rj = new ResizeJob(options, () => { });
            const result = await rj.isAlreadyCached(filename);
            expect(result).to.be.a('boolean');
        });

        it('returns false if file does not exist', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'teststring',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const filename = 'xxx.yy';
            const rj = new ResizeJob(options, () => { });
            const result = await rj.isAlreadyCached(filename);
            expect(result).to.be.false;
        });

        it('returns true if file does exist', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'teststring',
                url: 'http://example.com/test.jpg',
                suffix: '.jpg',
            };
            const filename = __filename;
            const rj = new ResizeJob(options, () => { });
            const result = await rj.isAlreadyCached(filename);
            expect(result).to.be.true;
        });
    });

    describe('validateRemoteSource()', () => {
        it('returns status code 400 on invalid urls', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'domain.com/path/image.jpg',
                url: 'domain.com/path/image.jpg',
                suffix: '.jpg',
            };
            const rj = new ResizeJob(options, () => { });
            const result = await rj.validateRemoteSource();
            expect(result).to.equal(400);
        });

        it('returns status code 404 on not existing urls', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'http://www.google.de/noimagehere.jpg',
                url: 'http://www.google.de/noimagehere.jpg',
                suffix: '.jpg',
            };
            const rj = new ResizeJob(options, () => { });
            const result = await rj.validateRemoteSource();
            expect(result).to.equal(404);
        }).timeout(10000);

        it('returns status code 415 on non image urls', async () => {
            const options: ImageOptions = {
                action: 'resize',
                width: '100',
                height: '100',
                gravity: 'c',
                format: 'jpg',
                quality: '80',
                imagefile: 'http://www.google.de/',
                url: 'http://www.google.de/',
                suffix: '.jpg',
            };
            const rj = new ResizeJob(options, () => { });
            const result = await rj.validateRemoteSource();
            expect(result).to.equal(415);
        }).timeout(10000);
    });
});
