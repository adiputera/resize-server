import { expect } from 'chai';
import RequestSplitter from '../src/lib/requestsplitter';

describe('RequestSplitter', () => {
    it('is a constructor function', () => {
        expect(RequestSplitter).to.be.a('function');
    });

    it('assigns first param to url', () => {
        const rs = new RequestSplitter('first');
        expect(rs['url']).to.equal('first');
    });

    it('assigns second param to query', () => {
        const rs = new RequestSplitter('first', { key: 'value' });
        expect(rs['query']).to.deep.equal({ key: 'value' });
    });

    it('has a static urlMatch property', () => {
        expect(RequestSplitter.urlMatch).to.exist;
    });

    describe('urlMatch', () => {
        it('is a regular expression', () => {
            expect(RequestSplitter.urlMatch).to.be.instanceOf(RegExp);
        });

        it('matches "/c200x200n/jpg,75/http://trakt.us/images/posters/892.jpg"', () => {
            const url = '/c200x200n/jpg,75/http://trakt.us/images/posters/892.jpg';
            const result = RequestSplitter.urlMatch.test(url);
            expect(result).to.equal(true);
        });

        it('treats leading slash as optional', () => {
            const url = 'c200x200n/jpg,75/http://trakt.us/images/posters/892.jpg';
            const result = RequestSplitter.urlMatch.test(url);
            expect(result).to.equal(true);
        });
    });

    it('has a mapOptions() method', () => {
        const rs = new RequestSplitter('');
        expect(rs.mapOptions).to.be.a('function');
    });

    describe('mapOptions()', () => {
        it('returns an options map', () => {
            const url = 'c200x400n/jpg,75/http://trakt.us/images/posters/892.jpg';
            const query = {
                demo: 'asd asd',
            };
            const rs = new RequestSplitter(url, query);
            const options = rs.mapOptions();
            expect(options).to.exist;
            expect(options.action).to.equal('crop');
            expect(options.width).to.equal('200');
            expect(options.height).to.equal('400');
            expect(options.gravity).to.equal('n');
            expect(options.format).to.equal('jpg');
            expect(options.quality).to.equal('75');
            expect(options.imagefile).to.equal('http://trakt.us/images/posters/892.jpg');
            expect(options.url).to.equal('http://trakt.us/images/posters/892.jpg?demo=asd%20asd');
            expect(options.suffix).to.equal('.jpg');
        });
    });
});
