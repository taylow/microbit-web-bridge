const fs = require('fs');
const express = require('express');
const router = express.Router();

const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));

/***
 * Handle GET requests to serve translations.json file.
 */
router.get('/', (req, res) => {
  res.send(translations);
});

module.exports = router;
