const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET main page. */
router.get('/', async(req, res, next) => {
  const decodedToken = await auth.verifyIdToken(req.session.user.token)
    .catch((err) => {
      console.error(err);
      res.redirect('/login');
    });

  const username = decodedToken.name;
  res.render('home', {
    username: username,
    user: true
  });
});

module.exports = router;
