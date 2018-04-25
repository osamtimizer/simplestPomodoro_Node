var express = require('express');
var router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'login page' });
});

router.post('/', async(req, res, next) => {
  const token = req.body.token;
  console.log(token);
  const decodedToken = await auth.verifyIdToken(token);
  const uid = decodedToken.uid;
  const ref = database.ref('users');
  const snapshot = await ref.once("value");

  if (!snapshot.hasChild(uid)) {
    console.log("no user found. redirect to register page.");
    res.redirect('/register');
  } else {
    console.log("add session to client");
    req.session.user = { token: token };
    req.session.save((err) => {
      if(err) {
        console.log(err);
      }
    });
    res.redirect('/home');
  }

});

module.exports = router;
