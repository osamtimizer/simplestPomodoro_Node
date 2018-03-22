const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('home');
});

module.exports = router;
