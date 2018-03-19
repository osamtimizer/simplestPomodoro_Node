var express = require('express');
var router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'login page' });
});

router.post('/', (req, res, next) => {
  const token = req.body.token;
  console.log(token);
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      res.send("VALIDATED");
    }).catch((err) => {
      console.error("Error: ", err);
    });

});

module.exports = router;
