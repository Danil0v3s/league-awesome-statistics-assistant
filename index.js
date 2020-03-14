Promise = require('bluebird');
const { mongo } = require('./config/vars')
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(mongo.uri, function (err, client) {
    if (err) throw err;

    // client.db('lass').collection('leagues').deleteMany({}, function (err, obj) {
    //     if (err) throw err;
    //     console.log(obj.result.n + " document(s) deleted");
    //     client.close();
    // })
});
