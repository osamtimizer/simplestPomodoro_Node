const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  req.session.user = { token: 'debug'};
  res.send("debug mode");
});

module.exports = router;
