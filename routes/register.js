var express = require('express');
var router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

router.get('/', function(req, res, next) {
  res.render('register');
});

module.exports = router;
