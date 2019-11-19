const express = require('express');
const router = express.Router();
const fs = require('fs');

const stream = fs.createWriteStream("debug.json");

stream.open();

/***
 * Handle POST requests made for telemetry purposes.
 */
router.post('/', (req, res, next) => {
  //FIXME: currently not saving the data correctly (undefined)
  stream.write(req.data + "\n");
  res.send("OK");
});

module.exports = router;
