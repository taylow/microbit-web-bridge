const express = require('express');
const router = express.Router();

/***
 * Handle GET requests for index and render the index page.
 */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Micro:bit WebBridge' });
});

module.exports = router;
