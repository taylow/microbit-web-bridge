const fs = require('fs');
const express = require('express');
const router = express.Router();

const hex = fs.readFileSync('hub.hex', 'utf8');

/***
 * Handle GET requests to serve hex file.
 */
router.get('/', (req, res) => {
    res.send(hex);
});

module.exports = router;
