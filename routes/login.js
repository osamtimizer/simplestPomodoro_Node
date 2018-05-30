var express = require('express');
var router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET login page. */
router.get('/', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('login', { title: 'login page' });
});

router.post('/', async(req, res, next) => {
  const token = req.body.token;
  const decodedToken = await auth.verifyIdToken(token).catch((err) => {
    next(err);
  });
  if (decodedToken === null || decodedToken === undefined) {
    next(new Error("Token is invalid"));
  } else {
    const uid = decodedToken.uid;
    const ref = database.ref('users');
    const snapshot = await ref.once("value");

    if (!snapshot.hasChild(uid)) {
      console.log("no user found. redirect to signup page.");
      res.redirect('/signup');
    } else {
      console.log("add session to client");
      req.session.user = { token: true };
      req.session.save((err) => {
        if(err) {
          next(err);
        } else {
          res.redirect('/home');
        }
      });
    }
  }

});

module.exports = router;
