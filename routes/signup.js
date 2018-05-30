const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

router.get('/', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/home');
  } else if (req.session.agreement) {
    next();
  } else {
    res.redirect('/eula');
  }
}, (req, res, next) => {
  res.render('signup');
});

module.exports = router;
