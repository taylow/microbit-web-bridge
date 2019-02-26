const express = require('express');
const request = require('request');
const fs = require('fs');

const router = express.Router();
const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));

/* GET users listing. */
router.get('/GET/', (req, res) => {
  //TODO: check if base URL matches the ones found in translations
  request(decodeURIComponent(req.query.url), function (error, response, body) {
    if (!error && response.statusCode === 200) {
      res.send(body); // Print the google web page.
    } else {
      res.status(error.status || 500);
    }
  });
});

/* GET users listing. */
router.post('/POST', (req, res) => {
  //TODO: add an elegant way of extracting all headers, currently only works for EiS API
  request({
    headers: {
      'school-id': req.headers["school-id"],
      'pi-id': req.headers["pi-id"]
    },
    uri: req.query.url,
    method: "POST",
    body: req.body,
    json: true
  },(err, body) => {
    res.json(body);
  });

  //req.pipe(request.post(req.query.url, {json: true, body: req.body, headers: req.headers}), {end: false}).pipe(res);

  //res.send('POST REQUEST ' + req.query.url);
  //res.redirect(307, decodeURIComponent(req.query.url));
  /*request(decodeURIComponent(req.query.url), {headers:req.headers, body: req.body}, (error, response, body) => {
    //res.send(body);
  });*/
});

/* Default */
router.get('/', (req, res) => {
  res.send("Use /GET or /POST to proxy a GET or POST request");
});



module.exports = router;
