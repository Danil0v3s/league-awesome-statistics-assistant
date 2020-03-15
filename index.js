Promise = require('bluebird');
const { mongo, port } = require('./config/vars')
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();

const { fetchCounters } = require('./lass/api/champion/counters.controller');

MongoClient.connect(mongo.uri, function (err, client) {
    if (err) throw err;

    const lass = client.db('lass');
    app.locals.lass = lass;

    app.get('/:championId/counters', fetchCounters);


    app.listen(port, () => console.info(`LASS started on ${port}`))
});
