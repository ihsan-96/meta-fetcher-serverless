const browser = require('./browser');

class Server {

    constructor(logger) {
        this.log = logger;
    }

    async start () {
        const serviceInitiators = {
            initBrowser: await browser.init(this.log)
            // Add similar service starters here such as db inits and config init
        };

        const starterPromises =[];

        for (const key in serviceInitiators) {
            starterPromises.push(serviceInitiators[key]);
        }

        return Promise.all(starterPromises);
    }

    faviconHandler (req, res, next) {
        if (req.url === '/favicon.ico') {
            res.send();
        } else {
            next();
        }
    }

    prepareRequest (req, res, next) {

        req.log = this.log.child({
            backend: 'NodeJs'
            // you can add fields that should be there on all the logs
        });
        next();
    }

    stop () {
        const serviceStoppers = {
            closeBrowser: new Promise((resolve, reject) => {
                browser.close()
                    .then(() => resolve())
                    .catch(e => reject(e));
            })
            // Add similar service starters here such as db inits and config init
        };
        
        const stoperPromises =[];

        for (const key in serviceStoppers) {
            stoperPromises.push(serviceStoppers[key]);
        }

        return Promise.allSettled(stoperPromises);
    }
}

module.exports = Server;
