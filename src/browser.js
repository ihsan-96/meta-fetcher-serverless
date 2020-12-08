const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core' );
const Constants = require('./constants');

class Browser {

    constructor() {
        this.browser = null;
        this.logger = console;
    }


    async init(log) {
        this.logger = log;
        this.logger.info('Initiating browser.');
        this.browser = await puppeteer.launch({
            headless: chromium.headless,
            args: [
                '--user-agent=Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                ...chromium.args
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            ignoreHTTPSErrors: true,
        });
        this.logger.info('Browser initiated.');
        return this.browser;
    }
    
    async createPageWithUrl(req) {

        if (!this.browser) {
            return req.log.error('Browser not initialized!');
        }

        const url = req.body.url;

        req.log.info({url}, 'Creating page with url.');
        const page = await this.browser.newPage().catch(e => req.log.error(e, 'Error while creating the page'));

        req.log.info({pageOpened: !!page}, 'Page created. Opening url.');
        await page.goto(url).catch(e => req.log.error(e, 'Error while opening url'));

        req.page = page;
        req.log.info({url: page.url()}, 'Url opened in page.');
    }
    
    async closePage(req) {
        req.log.info('Closing the page');
        await  req.page.close();
    }

    async collectMetaTags(req) {

        req.log.info('Collecting meta tags');
        if (!req.page) {
            return new Error('No page element found!');
        }

        let metaTags = await req.page.evaluate(() => {
            return Array.from(document.getElementsByTagName('meta')).map(meta => {

                const metadata = {};
                const metaAttributes = meta.getAttributeNames();

                metaAttributes.forEach(metaAttributeName => {
                    metadata[metaAttributeName] = meta.getAttribute(metaAttributeName);
                });

                return metadata;
            });
        });

        req.metaTags = metaTags;
        req.log.info({meta_tags_count: metaTags.length}, 'Meta tags collected');
    }

    getMetaTagName(metaTag) {
        metaTag = metaTag || {};
        let name = metaTag.property || metaTag.name || '';

        if (name.startsWith(Constants.OG_PREFIX)) {
            name = name.split(Constants.OG_PREFIX)[1];
        } else if (name.includes(Constants.COLLON_SEPERATOR)) {
            name = name.replace(Constants.COLON_REGEX, Constants.UNDERSCORE);
        }

        return name;
    }

    async getMetadata(req) {
        req.log.info('parsing metadata.');

        if (!req.metaTags) {
            return new Error('No meta tags found!');
        }

        const metadata = {};

        req.metaTags.forEach(metaTag => {
            const name = this.getMetaTagName(metaTag);

            if (name) {
                metadata[name] = metaTag.content;
            }
        });

        req.log.info(metadata, 'Metadata parsed');
        req.metadata = metadata;

        return Promise.resolve(metadata);
    }

    async getImages(req) {
        req.log.info('Getting Images from page');
        if (!req.page) {
            return new Error('No page element found!');
        }
        
        const images = await req.page.evaluate(() => Array.from(document.images, img => {
            return ['.jpg'].reduce((acc, ext) => acc || (img.src && img.src.endsWith(ext)), false) ? img.src : null;
        }).filter(e=>e));
        
        req.log.info({count: images && images.length}, 'Got Images from page');
        return images;
    }

    async fillMissingMetadata(req) {
        req.log.info('Filling missing meta fields');
        if (!req.page) {
            return new Error('No page element found!');
        }

        const metadata = req.metadata;

        metadata.title = metadata.title || req.page.title();
        if (!metadata.image) {
            metadata.images = await this.getImages(req);
        }

        req.log.info('Filled missing meta fields');
        return Promise.resolve(metadata);
    }
    
    async close() {
        this.logger.info('Browser closing.');
        await this.browser.close();
        this.logger.info('Browser closed.');
    }
}

module.exports = new Browser();
