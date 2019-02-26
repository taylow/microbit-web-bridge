const fs = require('fs');
const express = require('express');
const router = express.Router();

const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));

/* GET users listing. */
router.get('/', (req, res) => {
  res.send(translations);
});

module.exports = router;
