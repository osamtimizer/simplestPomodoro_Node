const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET main page. */
router.get('/', async(req, res, next) => {
  if (req.session.user !== undefined) {
  res.render('home', {
    title: "SimplestPomodoro",
    user: true
  });
  } else {
      res.redirect('/login');
  }
});

module.exports = router;
