const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const settings = require('./config/databaseSettings.json');

let db;

const connectionURI = `mongodb://${settings.mongo.user}:${settings.mongo.password}@${settings.mongo.uri}`;
MongoClient.connect(connectionURI, (err, client) => {
    if (err) return console.log(err);
    db = client.db('star-wars-quotes');
    app.listen(3000, () => {
        console.log('listening on 3000');
    });
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    db.collection('quotes').find().toArray(function(err, result) {
        if (err) return console.log(err);
        res.render('index.ejs', {quotes: result});
    });
});

app.post('/quotes', (req, res) => {
    db.collection('quotes').save(req.body, (err, result) => {
        if (err) return console.log(err);

        console.log('saved to database');
        res.redirect('/');
    });
});

app.put('/quotes', (req, res) => {
    db.collection('quotes')
        .findOneAndUpdate({name: {$regex : '.*Yoda.*'}}, {
            $set: {
                name: req.body.name,
                quote: req.body.quote,
            }
        }, {
            sort: {_id: -1},
            upsert: true,
        }, (err, result) => {
            if (err) return res.send(err);
            res.send(result);
        });
});

app.delete('/quotes', (req, res) => {
    db.collection('quotes').findOneAndDelete({name: req.body.name},
    (err, result) => {
        if (err) return res.send(500, err);
        res.send({message: 'A darth vader quote got deleted'});
    });
});
