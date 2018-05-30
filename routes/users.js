const express = require('express');
const router = express.Router();

//firebase
const admin = require('../firebase_init');
const auth = admin.auth();
const database = admin.database();

//Add new user
router.post('/', async(req, res, next) => {
  console.log("Users POST");

  if (req.body.uid === undefined || req.body.token === undefined) {
    next(new Error('parameter is invalid'));
  }
  const uid = req.body.uid;
  const token = req.body.token;

  auth.verifyIdToken(token)
    .then((decodedToken) => {
      if (decodedToken === null || decodedToken === undefined) {
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
        req.session.user = {token: token};
        res.redirect('/home');

      } else {
        console.log("New user. Create record for the user");

        //decodedTokenは毎回server->firebase adminで確認しに行けばいいので格納しなくて良い
        database.ref('users/' + uid).set('');

        //accessToken must be stored in secure cookie.
        req.session.user = { token: token };
        res.redirect('/home');
      }
    }).catch((err) => {
      console.error(err);
      next(err);
    });

});

//TODO:IMPL csrf middleware
router.post('/delete', async(req, res, next) => {
  const token = req.body.token;
  const decodedToken = await auth.verifyIdToken(token).catch((err) => {
    next(err);
  });
  if (decodedToken === null || decodedToken === undefined) {
    next(new Error("Token is invalid"));
  } else {
    //delete all information of user
    const uid = decodedToken.uid;
    auth.deleteUser(uid);
    database.ref('users/' + uid).remove()
      .then(() => {
        res.redirect('/');
      }).catch((err) => {
        next(err);
      });
  }
});

module.exports = router;
