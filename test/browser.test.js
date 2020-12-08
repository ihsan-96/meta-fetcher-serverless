'use strict';
const chai = require('chai');
chai.use(require('chai-url'));
const expect = chai.expect;

const { stub } = require('sinon');

const browser = require('../src/browser');

describe('browser', async () => {

    stub(console, 'log');
    stub(console, 'info');
    stub(console, 'error');


    const reqObject = { log: console, body: {} };

    before(async () => {
        await browser.init(console);
        // logStub = stub(console, 'log');
        // logInfoStub = stub(console, 'info');
        // logErrorStub = stub(console, 'error');
    });

    after(async () => {
        await browser.close();
    });



    it ('browser check', () => {
        expect(browser.browser).to.be.not.null;
    });

    context('createPageWithUrl', () => {

        const testUrl = 'http://www.google.com';
        reqObject.body.url = testUrl;

        afterEach(async () => {
            await reqObject.page.close();
        });

        it('should open a the correct webpage', async () => {

            await browser.createPageWithUrl(reqObject);

            const openedUrl = reqObject.page.url();
            expect(openedUrl).to.have.hostname(testUrl.split('//')[1]);
        });

    });

    context('collectMetaTags', () => {

        const testHtml = '<html><head><meta content="Metadata description." property="og:description">\n<meta content="Metadata" property="og:title"></head><body></body></html>';
        const testOutput = [{
            property: 'og:description',
            content: 'Metadata description.'
        }, {
            property: 'og:title',
            content: 'Metadata'
        }];

        beforeEach(async () => {
            reqObject.page = await browser.browser.newPage();
            reqObject.page.setContent(testHtml);
        });

        afterEach(async () => {
            reqObject.page.close();
        });

        it('should collect meta tags', async () => {

            await browser.collectMetaTags(reqObject);

            expect(reqObject.metaTags).to.be.deep.equal(testOutput);

        });

    });



});
