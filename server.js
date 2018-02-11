const bodyParser= require('body-parser');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const settings = require('./config/databaseSettings.json');

const connectionURI = `mongodb://${settings.mongo.user}:${settings.mongo.password}@${settings.mongo.uri}`;
mongoose.connect(connectionURI).then(() => {
    // db = client.db('star-wars-quotes');
    app.listen(3000, () => {
        console.log('listening on 3000');
    });
}).catch(err => {
    console.error('App starting error:', err.stack);
});

const quoteSchema = new Schema({
    name: String,
    quote: String,
    created_at: Date,
    updated_at: Date
});

quoteSchema.methods.darkLord = function() {
    // add the dark lord to the name
    this.name = this.name + ' the dark lord';

    return this.name;
};

// on every save, add the date
quoteSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at)
        this.created_at = currentDate;

    next();
});

const Quote = mongoose.model('Quote', quoteSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    Quote.find({}, (err, result) => {
        if (err) return console.log(err);
        res.render('index.ejs', {quotes: result});
    });
});

app.post('/quotes', (req, res) => {
    let newQuote = new Quote(req.body);

    newQuote.darkLord((err, name) => {
        if (err) return console.log(err);

        console.log('Your new name is ' + name);
    });

    newQuote.save((err) => {
        if (err) return console.log(err);

        console.log('saved to database');
        res.redirect('/');
    });
});

app.put('/quotes', (req, res) => {
    Quote.findOneAndUpdate({name: {$regex : '.*Yoda.*'}}, {
        name: req.body.name,
        quote: req.body.quote,
    }, {
        sort: {_id: -1},
        upsert: true,
    },(err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

app.delete('/quotes', (req, res) => {
    Quote.findOneAndRemove({name: req.body.name}, (err) => {
        if (err) return res.send(500, err);
        res.send({message: 'A darth vader quote got deleted'});
    });
});
