const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

router.get('/', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    next();
  }
}, (req, res, next) => {
  res.render('register');
});

module.exports = router;
