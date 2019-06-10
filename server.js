import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dns from 'dns';
import Url from './models/url';
import mongoose from 'mongoose';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true }).catch((error) => { console.log(error); });

app.use(cors({optionSuccessStatus: 200}));
app.use(express.static('public'));
app.use(express.urlencoded());

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl/new", function(req, res) {
  if (req.body.inputUrl[req.body.inputUrl.length-1] === '/') {
    req.body.inputUrl = req.body.inputUrl.slice(0, req.body.inputUrl.indexOf(req.body.inputUrl.length-1));
  }
  let requestString = req.body.inputUrl;
  const regX = /https?:\/\/(www\.)?\S+\.com|\.org|\.gov|\.tv|\.net/;
  if (regX.test(requestString) === false) {
    res.json({"error":"invalid URL"});
  }
  requestString = requestString.replace(/https?:\/\/(www\.)?/, '');
  if (requestString.indexOf('/') !== -1) {
    const slicePoint = requestString.indexOf('/');
    requestString = requestString.slice(0, slicePoint);
  }
  const webAddress = dns.lookup(requestString, function(err, addresses) {
    if (addresses === null || addresses === undefined) {
      res.json({"error":"Invalid URL"});
    }
    Url.find({}, {_id: 0, __v: 0})
      .exec(function(err, urls) {
        if (err) {
          res.status(400).send("unable to save to database");
        }
        const find = urls.filter(item => item.url === req.body.inputUrl);
        if (find.length === 1) {
          res.send(find[0]);
        }
        const numb = urls.length === 0 ? 0 : urls[urls.length-1].short_url;
        const data = new Url({url: req.body.inputUrl, short_url: (numb + 1).toString()});
        data.save()
         .then(item => {
           res.json({"original_url":req.body.inputUrl, "short_url": data.short_url});
         })
         .catch(err => {
           res.status(400).send("unable to save to database");
         }); 
      });  
  }); 
});

app.get("/api/shorturl/:number", function(req, res, next) {
  const regX = /^\d+$/;
  if (regX.test(req.params.number) === true) {
    next();
  } else {
    res.json({"error":"Wrong Format"});
  }
}, function(req, res) {
    Url.find({}, {_id: 0, __v: 0})
    .exec(function(err, urls) {
      if (err) {
        res.status(404).json({"error":"No short url found for given input"});  
      } 
      const find = urls.filter(item => item.short_url.toString() === req.params.number.toString());
      if (find.length === 0) {
        res.status(404).json({"error":"No short url found for given input"});
      } else {
        res.redirect(find[0].url);
      }
    });
});

const port = process.env.PORT || 3000;
const listener = app.listen(port);