'use strict';

const express = require('express');
const config = require('./config');
const Handler = require('./handler');

const router = express.Router();

router.get('/', (req, res) => res.send('Server Healthy!'));

router.post('/get_meta', Handler.authenticate(config.appUser, config.appPassword), Handler.checkServer, Handler.getMetaDataFromUrl);


module.exports = router;
