const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET main page. */
router.get('/', function(req, res, next) {
  let username = "";
  console.log("session token:", req.session.user.token);
  auth.verifyIdToken(req.session.user.token)
    .then((decodedToken) => {
      username = decodedToken.name;
      res.render('home', {
        username: username,
        user: true
      });
    }).catch((err) => {
      console.error(err);
    });
});

module.exports = router;
