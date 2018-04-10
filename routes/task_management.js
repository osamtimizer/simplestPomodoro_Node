const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');
const auth = admin.auth();
const database = admin.database();

router.get('/', function(req, res, next) {

  auth.verifyIdToken(req.session.user.token)
    .then((decodedToken) => {
      const username = decodedToken.name;
      res.render('task_management', {
        username: username,
        user: true
      });
    }).catch((err) => {
      console.error(err);
    });
});

module.exports = router;
