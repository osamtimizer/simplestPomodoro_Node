const express = require('express');
const router = express.Router();

//firebase
const admin = require('../firebase_init');
const auth = admin.auth();
const database = admin.database();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (req.session.user) {
    console.log(req.session.user);
    auth.verifyIdToken(req.session.user.token)
      .then((decodedToken) => {
        res.render("user", {displayName: decodedToken.displayName} );
      }).catch((err) => {
        console.error("Error: ", err);
        res.redirect('login');
      });
  } else {
    res.redirect('login');
  }
});

//Add new user
router.post('/', (req, res, next) => {
  console.log("Users POST");

  const uid = req.body.uid;
  const token = req.body.token;
  console.log("token: ", token);

  let isValid = true;

  auth.verifyIdToken(token)
    .then((decodedToken) => {
      if (decodedToken === null) {
        return new Promise((resolve, reject) => {
          reject(new Error("token is invalid"));
        });
      }
      if (uid !== decodedToken.uid) {
        return new Promise((resolve, reject) => {
          reject(new Error("uid is invalid"));
        });
      }
    }).then(() => {

      //uidが存在しなければthrow eとなる
      auth.getUser(uid)
        .then((userRecord) => {
          //既に登録されていたらメインページにリダイレクトしてやる

          database.ref('users').once('value')
            .then((snapshot) => {
              if (snapshot.hasChild(uid)) {
                console.log("user found");
                console.log("Token from client:", token);
                //generate new token to store in cookie.
                //TODO:validate token

                req.session.user = {token: token};
                res.redirect('/home');

              } else {
                console.log("New user. Create record for the user");

                //tokenは毎回server->firebase adminで確認しに行けばいいので格納しなくて良い
                database.ref('users/' + userRecord.uid).set('');

                //token must be stored in secure cookie.
                req.session.user = { token: token };
                res.redirect('/home');
              }
            });
        });

    }).catch((err) => {
      console.error(err);
      res.render('error');
    });

});

router.post('/delete', (req, res, next) => {
  const token = req.session.user.token;
  console.log("token:", token);
  console.log("token from cli:", req.body.token);
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      if (decodedToken === null) {
        //token is invalid
        return new Promise((resolve, reject) => {
          reject(new Error('token is invalid'));
        });
      } else {
        //delete all information of user
        //TODO:uncomment for deletion
        //auth.deleteUser(uid);
        //database.ref('users/' + uid).remove();
      }
    }).then(() => {
      res.redirect('/');
    }).catch((err) => {
      res.redirect('/settings', { message: 'an error occured'});
    });
});

module.exports = router;
