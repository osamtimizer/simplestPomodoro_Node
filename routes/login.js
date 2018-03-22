var express = require('express');
var router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'login page' });
});

router.post('/', (req, res, next) => {
  const token = req.body.token;
  console.log(token);
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      const ref = database.ref('users');
      ref.once("value")
        .then((snapshot) => {
          //TODO: check whether uid exists on firebaseDB
          const userId = snapshot.child(uid).child('userId').val();
          req.session.user = { token: token };
          res.redirect('/home');
        }).catch((err) => {
          console.error("Error: ", err);
        });
    }).catch((err) => {
      console.error("Error: ", err);
    });

});

module.exports = router;
