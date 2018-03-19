const express = require('express');
const router = express.Router();

const admin = require('firebase-admin');

const serviceAccount = require('../.simplestpomodoro.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  authDomain: 'simplestpomodoro.firebaseapp.com',
  databaseURL: 'simplestpomodoro.firebaseio.com'
});

const auth = admin.auth();
const database = admin.database();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send("GET");
});

router.get('/:userId', (req, res) => {
  //fetch user info from DB
  const uid = req.body.uid;
  const token = req.body.token;
  const userId = req.params.userId;

  database.ref('users/' + uid).once('value')
    .then((snapshot) => {
      const token_db = snapshot.child('token').val();
      const userId_db = snapshot.child('userId').val();
      const displayName = snapshot.child('displayName').val();
      if (token !== token_db || userId !== userId_db) {
        res.render("login");
      } else {
        res.render('users', {username: displayName});
      }
    }).catch((err) => {
      console.error("Error: ", err);
      res.render("login");
    });
});

//Add new user
router.post('/', (req, res, next) => {
  const uid = req.body.uid;
  const token = req.body.token;

  console.log("Users POST");


  //uidが存在しなければthrow eとなる
  let count = 0;
  auth.getUser(uid)
    .then((userRecord) => {
      //既に登録されていたらメインページにリダイレクトしてやる
      console.log("uid: ", userRecord.uid);
      console.log("providerId: ", userRecord.providerData[0].providerId);

      database.ref('users').once('value')
        .then((snapshot) => {
          if (snapshot.hasChild(uid)) {
            console.log("user found");
            res.redirect("users/" + snapshot.child(uid + '/userId').val());
          } else {
            count = snapshot.child('userCount').val();
          }
        }).then(() => {

          //tokenは毎回server->firebase adminで確認しに行けばいいので格納しなくて良い
          database.ref('users/' + userRecord.uid).set({
            userId: count,
            displayName: userRecord.displayName,
            email: userRecord.email,
            providerId: userRecord.providerData[0].providerId,
            token: token
          });

          const updated_count = count + 1;
          database.ref('users/userCount').set({
            count: updated_count
          });

          res.redirect('/users/' + count);
        }).catch((err) => {
          console.error("Error: ", err);
        });

    });
});

  module.exports = router;
