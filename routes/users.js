const express = require('express');
const router = express.Router();

//firebase
const admin = require('../firebase_init');
const auth = admin.auth();
const database = admin.database();

//Add new user
router.post('/', async(req, res, next) => {
  console.log("Users POST");

  const uid = req.body.uid;
  const token = req.body.token;

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
    }).then(async() => {

      //uidが存在しなければthrow eとなる
      //既に登録されていたらメインページにリダイレクトしてやる

      const snapshot = await database.ref('users').once('value');
      if (snapshot.hasChild(uid)) {
        console.log("user found");
        //generate new token to store in cookie.
        //TODO:validate token

        req.session.user = {token: token};
        res.redirect('/home');

      } else {
        console.log("New user. Create record for the user");

        //tokenは毎回server->firebase adminで確認しに行けばいいので格納しなくて良い
        database.ref('users/' + uid).set('');

        //token must be stored in secure cookie.
        req.session.user = { token: token };
        res.redirect('/home');
      }

    }).catch((err) => {
      console.error(err);
      res.render('error');
    });

});

router.post('/delete', (req, res, next) => {
  const token = req.session.user.token;
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
        const uid = decodedToken.uid;
        auth.deleteUser(uid);
        database.ref('users/' + uid).remove();
      }
    }).then(() => {
      res.redirect('/');
    }).catch((err) => {
      console.error(err);
      res.redirect('/settings');
    });
});

module.exports = router;
