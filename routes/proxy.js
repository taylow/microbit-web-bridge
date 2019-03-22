const express = require('express');
const request = require('request');
const fs = require('fs');

const router = express.Router();
const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));

/***
 * Handle GET requests made through the proxy
 */
router.get('/GET/', (req, res) => {
  //TODO: check if base URL matches the ones found in translations to prevent proxying unfiltered traffic
  /*request(decodeURIComponent(req.query.url), function (error, response, body) {
    if (!error && response.statusCode === 200) {
      res.send(body); // Print the google web page.
    } else {
      res.status(500);
    }
  });*/
  request({
    headers: {
      'school-id': req.headers["school-id"],
      'pi-id': req.headers["pi-id"]
    },
    uri: req.query.url,
    method: "GET"
  },(err, body) => {
    res.json(body);
  });
});

/***
 * Handle POST requests made through the proxy.
 */
router.post('/POST/', (req, res) => {
  //TODO: add an elegant way of extracting all headers, currently only works for EiS API
  console.log(req.body);
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
});

/***
 * Default
 */
router.get('/', (req, res) => {
  res.send("Use /GET or /POST to proxy a GET or POST request");
});



module.exports = router;
