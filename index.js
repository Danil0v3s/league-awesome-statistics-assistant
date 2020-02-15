Promise = require('bluebird');
const { mongo } = require('./config/vars')
const MongoClient = require('mongodb').MongoClient;
const crawler = require('./lass/crawler')

MongoClient.connect(mongo.uri, function (err, client) {
    if (err) throw err;
    crawler.init(client);

    // client.db('lass').collection('leagues').deleteMany({ region: 'KR' }, function (err, obj) {
    //     if (err) throw err;
    //     console.log(obj.result.n + " document(s) deleted");
    //     client.close();
    // })
});
