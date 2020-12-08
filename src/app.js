
const express = require('express');
const bunyan = require('bunyan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const Server = require('./server');
const routes = require('./routes');
const Config = require('./config');

const app = new express();

const log = bunyan.createLogger({
    name: Config.logging.name
});

const server = new Server(log);

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(server.faviconHandler);
app.use(server.prepareRequest.bind(server));

app.use('/', routes);


process.on('uncaughtException', err => {
    log.error({
        error: err.stack
    }, 'Uncaught Exception Occured..!!');
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
    
    process.on(signal, () => {
        server.stop()
            .then(() => {
                log.info('Successfully closing express server!');
                process.exit(0);
            }).catch(err => {
                log.error({
                    error: err
                }, 'Closing express server with errors.!!');
                process.exit(1);
            });
    });
}

module.exports = app;
