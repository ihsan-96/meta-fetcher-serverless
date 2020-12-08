'use strict';

const basicAuth = require('basic-auth');
const browser = require('./browser');

exports.getMetaDataFromUrl = async (req, res) => {

    await browser.createPageWithUrl(req).catch(e => req.log.error({error: e}, 'Error while creating the page'));
    await browser.collectMetaTags(req).catch(e => req.log.error({error: e}, 'Error while collecting meta tags'));
    await browser.getMetadata(req).catch(e => req.log.error({error: e}, 'Error while parsing metadata'));
    const metadata = await browser.fillMissingMetadata(req).catch(e => req.log.error({error: e}, 'Error while filling missing meta info'));
    await browser.closePage(req).catch(e => req.log.error({error: e}, 'Error while closing the connection'));

    if (metadata) {
        res.status(200).json({...metadata});
    } else {
        res.status(500).json({error: 'meta fetch failed.'});
    }
};

exports.checkServer = async (req, res, next) => {
    let browserObject = browser.browser;
    if (!browserObject) {
        req.log.info('Triggering browser start!');
        browserObject = await browser.init(req.log).catch(e => req.log(e, 'Browser '));
    }
    if (browserObject) {
        next();
    } else {
        res.status(400).send('Browser init failed');
    }
};

exports.authenticate = (username, password) => {
    return (req, res, next) => {
        req.headers.authorization = req.headers.authorization || req.headers.auth;

        const user = basicAuth(req);

        if (!user || user.name != username || user.pass != password) {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.sendStatus(401);
        }
        next();
    };
};
